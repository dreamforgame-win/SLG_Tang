import React, { useState, useEffect, useRef } from 'react';
import { useGame, Squad } from '../context/GameContext';
import { BattleUnit, BattleState, calculateMaxHp, calculateDamage, generateEnemySquad, convertPlayerSquadToBattleUnits, BATTLE_TICK_RATE, ATTACK_GAUGE_MAX, FORMATIONS, FORMATION_NAMES, FloatingTextEvent, Projectile } from '../utils/battleLogic';

interface BattleSceneProps {
  playerSquadId: number;
  landLevel: number;
  onVictory: () => void;
  onDefeat: () => void;
  onClose: () => void;
}

export default function BattleScene({ playerSquadId, landLevel, onVictory, onDefeat, onClose }: BattleSceneProps) {
  const { squads, generals, getGeneralStats } = useGame();
  const [battleState, setBattleState] = useState<BattleState | null>(null);
  const [battleTime, setBattleTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(1);
  
  const battleLoopRef = useRef<number | null>(null);
  const floatingTextIdCounter = useRef(0);
  const projectileIdCounter = useRef(0);

  // Initialize Battle
  useEffect(() => {
    const playerSquad = squads[playerSquadId];
    if (!playerSquad) return;

    const playerUnits = convertPlayerSquadToBattleUnits(playerSquad, generals, getGeneralStats);
    const { units: enemyUnits, formation: enemyFormation, formationLevel: enemyFormationLevel } = generateEnemySquad(landLevel);

    // Initialize floatingTexts array
    playerUnits.forEach(u => u.floatingTexts = []);
    enemyUnits.forEach(u => u.floatingTexts = []);

    // Apply start of battle skills
    const allUnits = [...playerUnits, ...enemyUnits];
    allUnits.forEach(unit => {
      if (unit.skill?.name === '天可汗') {
        const allies = unit.side === 'player' ? playerUnits : enemyUnits;
        allies.forEach(ally => {
          ally.buffs.push({ id: `immune-${unit.instanceId}`, type: 'immuneControl', duration: 15, timer: 0, sourceId: unit.instanceId });
          ally.buffs.push({ id: `stats-${unit.instanceId}`, type: 'statsBoost', value: 20, duration: 15, timer: 0, sourceId: unit.instanceId });
        });
        unit.skillText = '天可汗！';
        unit.skillTextTimer = 2;
      }
      if (unit.skill?.name === '六军镜') {
        const allies = unit.side === 'player' ? playerUnits : enemyUnits;
        allies.forEach(ally => {
          ally.buffs.push({ id: `dmgRed-${unit.instanceId}`, type: 'damageReduction', value: 0.25, sourceId: unit.instanceId });
        });
        unit.skillText = '六军镜！';
        unit.skillTextTimer = 2;
      }
      if (unit.skill?.name === '门神庇佑') {
        unit.buffs.push({ id: `taunt-${unit.instanceId}`, type: 'taunt', duration: 10, timer: 0, sourceId: unit.instanceId });
        unit.skillText = '门神庇佑！';
        unit.skillTextTimer = 2;
      }
      if (unit.skill?.name === '娘子军') {
        const allies = unit.side === 'player' ? playerUnits : enemyUnits;
        allies.forEach(ally => {
          if (ally.id !== 'pingyang-princess') {
            ally.buffs.push({ id: `dmgBoost-${unit.instanceId}`, type: 'damageBoost', value: 0.15, sourceId: unit.instanceId });
          }
        });
        unit.skillText = '娘子军！';
        unit.skillTextTimer = 2;
      }
      if (unit.skill?.name === '坚壁清野') {
        unit.buffs.push({ id: `defBoost-${unit.instanceId}`, type: 'defenseBoost', value: 50, sourceId: unit.instanceId });
        unit.skillText = '坚壁清野！';
        unit.skillTextTimer = 2;
      }
      if (unit.skill?.name === '星宿护关') {
        const allies = unit.side === 'player' ? playerUnits : enemyUnits;
        const shieldAmount = unit.defense * 1.5;
        allies.forEach(ally => {
          ally.shield += shieldAmount;
        });
        unit.skillText = '星宿护关！';
        unit.skillTextTimer = 2;
      }
      if (unit.skill?.name === '威镇边关') {
        const enemies = unit.side === 'player' ? enemyUnits : playerUnits;
        enemies.forEach(enemy => {
          if (enemy.type === 'Cavalry') {
            enemy.buffs.push({ id: `dmgRedCav-${unit.instanceId}`, type: 'damageReduction', value: 0.20, sourceId: unit.instanceId });
          }
        });
        unit.skillText = '威镇边关！';
        unit.skillTextTimer = 2;
      }
    });

    setBattleState({
      playerUnits,
      enemyUnits,
      projectiles: [],
      playerFormation: playerSquad.formation,
      playerFormationLevel: playerSquad.formationLevel || 1,
      enemyFormation: enemyFormation,
      enemyFormationLevel: enemyFormationLevel,
      status: 'fighting',
      logs: ['Battle Start!']
    });

  }, [playerSquadId, landLevel, squads, generals, getGeneralStats]);

  // Battle Loop
  useEffect(() => {
    if (!battleState || battleState.status !== 'fighting' || isPaused) {
      if (battleLoopRef.current) cancelAnimationFrame(battleLoopRef.current);
      return;
    }

    let lastTime = performance.now();
    const tickInterval = 1000 / BATTLE_TICK_RATE;
    let accumulator = 0;

    const loop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      accumulator += deltaTime;

      if (accumulator >= tickInterval) {
        // Apply game speed multiplier here
        updateBattle((tickInterval / 1000) * gameSpeed, currentTime); 
        accumulator -= tickInterval;
      }

      if (battleState.status === 'fighting') {
        battleLoopRef.current = requestAnimationFrame(loop);
      }
    };

    battleLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (battleLoopRef.current) cancelAnimationFrame(battleLoopRef.current);
    };
  }, [battleState, isPaused, gameSpeed]);

  const updateBattle = (dt: number, currentTime: number) => {
    setBattleState(prevState => {
      if (!prevState || prevState.status !== 'fighting') return prevState;

      const nextPlayerUnits = prevState.playerUnits.map(u => ({...u, buffs: [...u.buffs], floatingTexts: [...u.floatingTexts]}));
      const nextEnemyUnits = prevState.enemyUnits.map(u => ({...u, buffs: [...u.buffs], floatingTexts: [...u.floatingTexts]}));
      const nextProjectiles = [...prevState.projectiles];
      const nextLogs = [...prevState.logs];
      let status = prevState.status;

      // Helper to process units
      const processUnit = (unit: BattleUnit, allies: BattleUnit[], enemies: BattleUnit[]) => {
        if (unit.isDead) return;

        // Process Buffs
        unit.buffs = unit.buffs.filter(b => {
          if (b.duration) {
            b.timer = (b.timer || 0) + dt;
            return b.timer < b.duration;
          }
          return true;
        });

        // Process Time-based Skills
        unit.skillTimer += dt;
        
        if (unit.skill?.name === '天可汗' && battleTime >= 15) {
          if (unit.skillTimer >= 5) {
            unit.skillTimer = 0;
            const aliveAllies = allies.filter(a => !a.isDead);
            if (aliveAllies.length > 0) {
              const lowestHpAlly = aliveAllies.reduce((prev, curr) => (prev.currentHp / prev.maxHp < curr.currentHp / curr.maxHp) ? prev : curr);
              const healAmount = Math.floor(lowestHpAlly.maxHp * 0.05);
              lowestHpAlly.currentHp = Math.min(lowestHpAlly.maxHp, lowestHpAlly.currentHp + healAmount);
              lowestHpAlly.floatingTexts.push({ id: floatingTextIdCounter.current++, text: `+${healAmount}`, type: 'heal', timestamp: currentTime, xOffset: 0, yOffset: -20 });
              unit.skillText = '天可汗！';
              unit.skillTextTimer = 2;
            }
          }
        }
        
        if (unit.skill?.name === '再造大唐' && battleTime >= 20) {
          if (unit.skillTimer >= 5) {
            unit.skillTimer = 0;
            if (Math.random() < 0.7) {
              allies.forEach(a => {
                a.buffs = a.buffs.filter(b => !['weakness', 'defenseDown', 'panic', 'silence', 'burn', 'attackSpeedDown'].includes(b.type));
              });
              const aliveAllies = allies.filter(a => !a.isDead);
              for (let i = 0; i < 2 && aliveAllies.length > 0; i++) {
                const targetIdx = Math.floor(Math.random() * aliveAllies.length);
                const target = aliveAllies.splice(targetIdx, 1)[0];
                const healAmount = Math.floor(unit.strategy * 1.5);
                target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
                target.floatingTexts.push({ id: floatingTextIdCounter.current++, text: `+${healAmount}`, type: 'heal', timestamp: currentTime, xOffset: 0, yOffset: -20 });
              }
              unit.skillText = '再造大唐！';
              unit.skillTextTimer = 2;
            }
          }
        }
        
        if (unit.skill?.name === '坚壁清野') {
          if (unit.skillTimer >= 5) {
            unit.skillTimer = 0;
            if (Math.random() < 0.5) {
              const aliveAllies = allies.filter(a => !a.isDead && a.instanceId !== unit.instanceId);
              if (aliveAllies.length > 0) {
                const lowestHpAlly = aliveAllies.reduce((prev, curr) => (prev.currentHp / prev.maxHp < curr.currentHp / curr.maxHp) ? prev : curr);
                lowestHpAlly.buffs.push({ id: `share-${unit.instanceId}`, type: 'shareDamage', value: 0.4, duration: 3, timer: 0, sourceId: unit.instanceId });
                unit.skillText = '坚壁清野！';
                unit.skillTextTimer = 2;
              }
            }
          }
        }
        
        if (unit.skill?.name === '威镇边关') {
          if (unit.skillTimer >= 5) {
            unit.skillTimer = 0;
            if (Math.random() < 0.4) {
              const aliveEnemies = enemies.filter(e => !e.isDead);
              if (aliveEnemies.length > 0) {
                const highestStrEnemy = aliveEnemies.reduce((prev, curr) => (prev.strength > curr.strength) ? prev : curr);
                highestStrEnemy.buffs.push({ id: `atkSpdDown-${unit.instanceId}`, type: 'attackSpeedDown', value: 0.3, duration: 5, timer: 0, sourceId: unit.instanceId });
                unit.skillText = '威镇边关！';
                unit.skillTextTimer = 2;
              }
            }
          }
        }

        // Process Evasion / HP threshold
        if (unit.skill?.name === '回马枪' && !unit.hpThresholdTriggered && unit.currentHp < unit.maxHp * 0.5) {
          unit.hpThresholdTriggered = true;
          const aliveEnemies = enemies.filter(e => !e.isDead);
          if (aliveEnemies.length > 0) {
            aliveEnemies.sort((a, b) => b.row - a.row); // Find main general (highest row)
            const target = aliveEnemies[0];
            const damage = calculateDamage(unit, target, false, true) * 3; // 300% ignore defense
            target.currentHp = Math.max(0, target.currentHp - damage);
            target.floatingTexts.push({ id: floatingTextIdCounter.current++, text: `-${damage}`, type: 'damage', timestamp: currentTime, xOffset: 0, yOffset: -20 });
            if (target.currentHp === 0) target.isDead = true;
            unit.buffs.push({ id: `evasion-${unit.instanceId}`, type: 'evasion', value: 1, sourceId: unit.instanceId });
            unit.skillText = '回马枪！';
            unit.skillTextTimer = 2;
          }
        }

        // Process Burn / Panic
        unit.buffs.forEach(b => {
          if (b.type === 'burn' && b.timer && b.timer >= 1) {
            b.timer = 0; // Reset for next tick
            const dmg = Math.floor(100); // Simplified burn damage
            unit.currentHp = Math.max(0, unit.currentHp - dmg);
            unit.floatingTexts.push({ id: floatingTextIdCounter.current++, text: `-${dmg}`, type: 'damage', timestamp: currentTime, xOffset: 0, yOffset: -20 });
            if (unit.currentHp === 0) unit.isDead = true;
          }
          if (b.type === 'panic' && b.timer && b.timer >= 1) {
            b.timer = 0;
            const dmg = Math.floor(50);
            unit.currentHp = Math.max(0, unit.currentHp - dmg);
            unit.floatingTexts.push({ id: floatingTextIdCounter.current++, text: `-${dmg}`, type: 'damage', timestamp: currentTime, xOffset: 0, yOffset: -20 });
            if (unit.currentHp === 0) unit.isDead = true;
          }
        });

        // Check Silence / Stun
        const isSilenced = unit.buffs.some(b => b.type === 'silence');
        const isStunned = unit.buffs.some(b => b.type === 'weakness'); // Using weakness as stun for simplicity
        
        let effSpeed = unit.speed;
        unit.buffs.forEach(b => {
          if (b.type === 'attackSpeedDown') effSpeed *= (1 - (b.value || 0));
          if (b.type === 'combo') effSpeed *= 2;
        });

        // Increase Gauge
        if (!isStunned) {
          unit.currentGauge += effSpeed * dt * 0.5; // Speed scaling factor
        }
        
        if (unit.currentGauge >= ATTACK_GAUGE_MAX) {
          unit.currentGauge = 0;
          
          let target = findTarget(enemies);
          
          // Taunt override
          const taunters = enemies.filter(e => !e.isDead && e.buffs.some(b => b.type === 'taunt'));
          if (taunters.length > 0) {
            target = taunters[Math.floor(Math.random() * taunters.length)];
          }

          if (target) {
            unit.attackCount++;
            let isSkillAttack = false;

            // Check Attack Count Skills
            if (!isSilenced) {
              if (unit.skill?.name === '撒手锏' && unit.attackCount >= 5) {
                unit.attackCount = 0;
                isSkillAttack = true;
                const damage = calculateDamage(unit, target) * 2.4;
                target.currentGauge = 0;
                nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: target.instanceId, damage: damage, progress: 0, speed: 2.0 * dt, type: 'skill' });
                unit.skillText = '撒手锏！';
                unit.skillTextTimer = 2;
              }
              else if (unit.skill?.name === '三板斧' && unit.attackCount >= 6) {
                unit.attackCount = 0;
                isSkillAttack = true;
                const damages = [2.0, 1.5, 1.0].map(m => calculateDamage(unit, target) * m);
                damages.forEach((dmg, idx) => {
                  nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: target.instanceId, damage: dmg, progress: -0.4 * idx, speed: 2.0 * dt, type: 'skill' });
                });
                target.buffs.push({ id: `weakness-${unit.instanceId}`, type: 'weakness', duration: 3, timer: 0, sourceId: unit.instanceId });
                unit.skillText = '三板斧！';
                unit.skillTextTimer = 2;
              }
              else if (unit.skill?.name === '三箭定天山' && unit.attackCount >= 4) {
                unit.attackCount = 0;
                isSkillAttack = true;
                const aliveEnemies = enemies.filter(e => !e.isDead);
                for (let i = 0; i < 3 && aliveEnemies.length > 0; i++) {
                  const tIdx = Math.floor(Math.random() * aliveEnemies.length);
                  const t = aliveEnemies.splice(tIdx, 1)[0];
                  const damage = calculateDamage(unit, t) * 1.2;
                  t.buffs.push({ id: `defDown-${unit.instanceId}`, type: 'defenseDown', value: 30, duration: 10, timer: 0, sourceId: unit.instanceId });
                  nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: t.instanceId, damage: damage, progress: 0, speed: 2.0 * dt, type: 'skill' });
                }
                unit.skillText = '三箭定天山！';
                unit.skillTextTimer = 2;
              }
              else if (unit.skill?.name === '灭国之威' && unit.attackCount >= 4) {
                unit.attackCount = 0;
                isSkillAttack = true;
                const aliveEnemies = enemies.filter(e => !e.isDead).slice(0, 3);
                aliveEnemies.forEach(t => {
                  const damage = calculateDamage(unit, t, true); // strategy damage
                  if (Math.random() < 0.5) {
                    t.buffs.push({ id: `panic-${unit.instanceId}`, type: 'panic', duration: 6, timer: 0, sourceId: unit.instanceId });
                  }
                  nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: t.instanceId, damage: damage, progress: 0, speed: 2.0 * dt, type: 'skill' });
                });
                unit.skillText = '灭国之威！';
                unit.skillTextTimer = 2;
              }
              else if (unit.skill?.name === '一人灭国' && unit.attackCount >= 7) {
                unit.attackCount = 0;
                isSkillAttack = true;
                unit.maxHp += 2000;
                unit.currentHp += 2000;
                const aliveEnemies = enemies.filter(e => !e.isDead);
                for (let i = 0; i < 2 && aliveEnemies.length > 0; i++) {
                  const tIdx = Math.floor(Math.random() * aliveEnemies.length);
                  const t = aliveEnemies.splice(tIdx, 1)[0];
                  const damage = Math.floor(unit.currentHp * 0.1);
                  nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: t.instanceId, damage: damage, progress: 0, speed: 2.0 * dt, type: 'skill' });
                }
                unit.skillText = '一人灭国！';
                unit.skillTextTimer = 2;
              }
              else if (unit.skill?.name === '雪岭奇袭' && unit.attackCount >= 5) {
                unit.attackCount = 0;
                isSkillAttack = true;
                const aliveEnemies = enemies.filter(e => !e.isDead);
                if (aliveEnemies.length > 0) {
                  aliveEnemies.sort((a, b) => b.row - a.row);
                  const t = aliveEnemies[0];
                  const damage = calculateDamage(unit, t) * 2.2;
                  t.currentGauge *= 0.5;
                  nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: t.instanceId, damage: damage, progress: 0, speed: 2.0 * dt, type: 'skill' });
                  unit.skillText = '雪岭奇袭！';
                  unit.skillTextTimer = 2;
                }
              }
              else if (unit.skill?.name === '儒将风范' && unit.attackCount >= 4) {
                unit.attackCount = 0;
                isSkillAttack = true;
                const aliveEnemies = enemies.filter(e => !e.isDead);
                for (let i = 0; i < 2 && aliveEnemies.length > 0; i++) {
                  const tIdx = Math.floor(Math.random() * aliveEnemies.length);
                  const t = aliveEnemies.splice(tIdx, 1)[0];
                  const damage = calculateDamage(unit, t, true) * 1.4;
                  if (Math.random() < 0.6) {
                    t.buffs.push({ id: `silence-${unit.instanceId}`, type: 'silence', duration: 5, timer: 0, sourceId: unit.instanceId });
                  }
                  nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: t.instanceId, damage: damage, progress: 0, speed: 2.0 * dt, type: 'skill' });
                }
                unit.skillText = '儒将风范！';
                unit.skillTextTimer = 2;
              }
              else if (unit.skill?.name === '白江火网' && unit.attackCount >= 4) {
                unit.attackCount = 0;
                isSkillAttack = true;
                const aliveEnemies = enemies.filter(e => !e.isDead);
                for (let i = 0; i < 2 && aliveEnemies.length > 0; i++) {
                  const tIdx = Math.floor(Math.random() * aliveEnemies.length);
                  const t = aliveEnemies.splice(tIdx, 1)[0];
                  if (t.buffs.some(b => b.type === 'burn')) {
                    const damage = calculateDamage(unit, t, true) * 1.5;
                    nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: t.instanceId, damage: damage, progress: 0, speed: 2.0 * dt, type: 'skill' });
                  } else {
                    t.buffs.push({ id: `burn-${unit.instanceId}`, type: 'burn', duration: 5, timer: 0, sourceId: unit.instanceId });
                  }
                }
                unit.skillText = '白江火网！';
                unit.skillTextTimer = 2;
              }
            }

            if (!isSkillAttack) {
              // Normal Attack
              const damage = calculateDamage(unit, target);
              nextProjectiles.push({
                id: projectileIdCounter.current++,
                attackerId: unit.instanceId,
                targetId: target.instanceId,
                damage: damage,
                progress: 0,
                speed: 2.0 * dt,
                type: 'normal'
              });
              
              // 黑齿常之 夜袭
              if (unit.skill?.name === '夜袭' && Math.random() < 0.4) {
                const extraDmg = damage * 1.5;
                nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: unit.instanceId, targetId: target.instanceId, damage: extraDmg, progress: -0.4, speed: 2.0 * dt, type: 'skill' });
                unit.buffs.push({ id: `combo-${unit.instanceId}`, type: 'combo', duration: 3, timer: 0, sourceId: unit.instanceId });
                unit.skillText = '夜袭！';
                unit.skillTextTimer = 2;
              }
            }
            
            // Trigger animation state
            unit.isAttacking = true;
            unit.attackAnimTimer = 0.3;
          }
        }

        // Animation Timers
        if (unit.attackAnimTimer && unit.attackAnimTimer > 0) {
          unit.attackAnimTimer -= dt;
          if (unit.attackAnimTimer <= 0) {
            unit.isAttacking = false;
            unit.attackAnimTimer = undefined;
          }
        }

        // Skill Text Timer
        if (unit.skillTextTimer && unit.skillTextTimer > 0) {
          unit.skillTextTimer -= dt;
          if (unit.skillTextTimer <= 0) {
            unit.skillText = undefined;
          }
        }

        // Cleanup old floating texts
        unit.floatingTexts = unit.floatingTexts.filter(ft => currentTime - ft.timestamp < 1000);
      };

      // Process Player Units
      nextPlayerUnits.forEach(unit => processUnit(unit, nextPlayerUnits, nextEnemyUnits));

      // Process Enemy Units
      nextEnemyUnits.forEach(unit => processUnit(unit, nextEnemyUnits, nextPlayerUnits));

      // Process Projectiles
      for (let i = nextProjectiles.length - 1; i >= 0; i--) {
        const proj = nextProjectiles[i];
        proj.progress += proj.speed;

        if (proj.progress >= 1) {
          // Hit!
          const allUnits = [...nextPlayerUnits, ...nextEnemyUnits];
          const target = allUnits.find(u => u.instanceId === proj.targetId);
          const attacker = allUnits.find(u => u.instanceId === proj.attackerId);

          if (target && !target.isDead) {
            // Check Evasion
            const evasionBuff = target.buffs.find(b => b.type === 'evasion');
            if (evasionBuff && evasionBuff.value && evasionBuff.value > 0) {
              evasionBuff.value--;
              target.floatingTexts.push({ id: floatingTextIdCounter.current++, text: '闪避', type: 'heal', timestamp: currentTime, xOffset: 0, yOffset: -20 });
            } else {
              let actualDamage = proj.damage;
              
              // Check Shield
              if (target.shield > 0) {
                if (target.shield >= actualDamage) {
                  target.shield -= actualDamage;
                  actualDamage = 0;
                } else {
                  actualDamage -= target.shield;
                  target.shield = 0;
                }
              }

              // Check Share Damage
              const shareBuff = target.buffs.find(b => b.type === 'shareDamage');
              if (shareBuff && shareBuff.sourceId && actualDamage > 0) {
                const source = allUnits.find(u => u.instanceId === shareBuff.sourceId);
                if (source && !source.isDead) {
                  const sharedDmg = Math.floor(actualDamage * (shareBuff.value || 0));
                  actualDamage -= sharedDmg;
                  source.currentHp = Math.max(0, source.currentHp - sharedDmg);
                  source.floatingTexts.push({ id: floatingTextIdCounter.current++, text: `-${sharedDmg}`, type: 'damage', timestamp: currentTime, xOffset: 0, yOffset: -20 });
                  if (source.currentHp === 0) source.isDead = true;
                }
              }

              if (actualDamage > 0) {
                target.currentHp = Math.max(0, target.currentHp - actualDamage);
                
                // Add floating text
                target.floatingTexts.push({
                  id: floatingTextIdCounter.current++,
                  text: `-${Math.floor(actualDamage)}`,
                  type: proj.type === 'skill' ? 'crit' : 'damage',
                  timestamp: currentTime,
                  xOffset: (Math.random() - 0.5) * 40,
                  yOffset: (Math.random() - 0.5) * 20
                });

                if (target.currentHp === 0) {
                  target.isDead = true;
                  if (attacker) {
                    nextLogs.push(`${attacker.name} defeated ${target.name}!`);
                  }
                } else if (attacker && !attacker.isDead) {
                  // Counter attacks
                  if (target.skill?.name === '门神庇佑' && Math.random() < 0.6) {
                    const counterDmg = calculateDamage(target, attacker);
                    nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: target.instanceId, targetId: attacker.instanceId, damage: counterDmg, progress: 0, speed: 2.0 * dt, type: 'skill' });
                    target.skillText = '门神庇佑！';
                    target.skillTextTimer = 2;
                  }
                  
                  // 平阳公主 娘子军 反击
                  if (target.row === 2) { // Assuming row 2 is main general
                    const allies = target.side === 'player' ? nextPlayerUnits : nextEnemyUnits;
                    const pingyang = allies.find(a => a.skill?.name === '娘子军' && !a.isDead);
                    if (pingyang && Math.random() < 0.4) {
                      const counterDmg = calculateDamage(pingyang, attacker);
                      nextProjectiles.push({ id: projectileIdCounter.current++, attackerId: pingyang.instanceId, targetId: attacker.instanceId, damage: counterDmg, progress: 0, speed: 2.0 * dt, type: 'skill' });
                      pingyang.skillText = '娘子军！';
                      pingyang.skillTextTimer = 2;
                    }
                  }
                }
              }
            }
          }
          // Remove projectile
          nextProjectiles.splice(i, 1);
        }
      }

      // Check Win/Loss
      const playerAlive = nextPlayerUnits.some(u => !u.isDead);
      const enemyAlive = nextEnemyUnits.some(u => !u.isDead);

      if (!playerAlive) {
        status = 'defeat';
        setTimeout(() => setShowResult(true), 1000);
      } else if (!enemyAlive) {
        status = 'victory';
        setTimeout(() => setShowResult(true), 1000);
      }

      return {
        ...prevState,
        playerUnits: nextPlayerUnits,
        enemyUnits: nextEnemyUnits,
        projectiles: nextProjectiles,
        status,
        logs: nextLogs.slice(-5) // Keep last 5 logs
      };
    });
    
    setBattleTime(prev => prev + dt);
  };

  const findTarget = (enemies: BattleUnit[]): BattleUnit | null => {
    // Filter alive enemies
    const aliveEnemies = enemies.filter(u => !u.isDead);
    if (aliveEnemies.length === 0) return null;

    // Sort by row (0 is front) then random within row
    aliveEnemies.sort((a, b) => a.row - b.row);
    
    // Get first available row
    const targetRow = aliveEnemies[0].row;
    const rowTargets = aliveEnemies.filter(u => u.row === targetRow);
    
    // Pick random target in that row
    return rowTargets[Math.floor(Math.random() * rowTargets.length)];
  };

  const renderRow = (units: BattleUnit[], capacity: number, isEnemy: boolean) => {
    const elements = [];
    let currentSlot = 0;

    while (currentSlot < capacity) {
      const unit = units.find(u => u.col === currentSlot);
      
      if (unit) {
        // Render Unit
        // Calculate width based on cost
        // Base width w-16 (4rem = 64px) (reduced from 5rem/80px). Gap 2 (0.5rem = 8px).
        // Width = cost * 4rem + (cost - 1) * 0.5rem
        const widthStyle = { width: `calc(${unit.cost} * 4rem + ${unit.cost - 1} * 0.5rem)` };
        
        elements.push(
          <div key={`unit-${unit.instanceId}`} style={widthStyle}>
            <BattleUnitCard unit={unit} isEnemy={isEnemy} />
          </div>
        );
        currentSlot += unit.cost;
      } else {
        // Render Empty Slot
        elements.push(
          <div key={`empty-${currentSlot}`} className="w-16 h-[5.6rem] bg-black/20 rounded-lg border border-white/5 flex items-center justify-center">
          </div>
        );
        currentSlot += 1;
      }
    }
    return elements;
  };

  if (!battleState) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Loading Battle...</div>;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-white/10 bg-zinc-900/50 backdrop-blur-md shrink-0 z-50 relative">
        <div className="text-gold font-bold text-lg tracking-widest">BATTLE START</div>
        
        {/* Speed Control */}
        <div className="flex items-center bg-black/40 rounded-lg p-1 border border-white/10">
          {[1, 2, 3].map(speed => (
            <button
              key={speed}
              onClick={() => setGameSpeed(speed)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                gameSpeed === speed 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              x{speed}
            </button>
          ))}
        </div>

        <div className="font-mono text-slate-400 text-sm w-16 text-right">{battleTime.toFixed(1)}s</div>
      </div>

      {/* Battlefield */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-2 bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKIFUEl0iKziOG2yQ9CEeaJqmB1umqAoLR_Cjt8-x5a1rt4qrpWxjij5rb9iaC4IT0JFAH9SVDJ6ZBi3ejMib-D6sHT9iD7_sYnvVLuU32K6DELni58nxSWK6yLAsqQPo4lrRYvpnQRXnbUW1zoVcUgZp5dCFi_UpAPfmOO9ygKVUElBxRvP8jGDAg9rK1J-m4UnCpsXHFn9NT-ULnP613M-UzSiPJsxitTnj99Cy2_whdwiDEVTALnwafe7j1N-U5nnLHMFoi1w')] bg-cover bg-center overflow-hidden">
        <div className="absolute inset-0 bg-black/60"></div>
        
        {/* Projectile Layer */}
        <div className="absolute inset-0 pointer-events-none z-40">
          {battleState.projectiles.map(proj => (
            <ProjectileRenderer key={proj.id} projectile={proj} />
          ))}
        </div>

        {/* Enemy Formation (Top) */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-[10px] pt-4 pb-[20px]">
           {[2, 1, 0].map(rowIndex => {
             const rowCapacity = FORMATIONS[battleState.enemyFormation][battleState.enemyFormationLevel][rowIndex];
             return (
               <div key={`enemy-row-${rowIndex}`} className="flex justify-center gap-2 h-[5.6rem] w-full">
                 {rowCapacity !== undefined && renderRow(battleState.enemyUnits.filter(u => u.row === rowIndex), rowCapacity, true)}
               </div>
             );
           })}
        </div>

        {/* VS Divider with Formation Names */}
        <div className="relative z-10 w-full h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-0 flex items-center justify-center shrink-0 gap-4">
           <div className="text-red-400 text-[10px] font-bold tracking-wider uppercase bg-black/60 px-2 py-0.5 rounded border border-red-500/20">
             {FORMATION_NAMES[battleState.enemyFormation]} Lv.{battleState.enemyFormationLevel}
           </div>
           
           <div className="bg-black px-4 py-0.5 border border-red-500/30 rounded-full text-red-500 font-bold text-[10px] tracking-[0.5em]">VS</div>
           
           <div className="text-blue-400 text-[10px] font-bold tracking-wider uppercase bg-black/60 px-2 py-0.5 rounded border border-blue-500/20">
             {FORMATION_NAMES[battleState.playerFormation]} Lv.{battleState.playerFormationLevel}
           </div>
        </div>

        {/* Player Formation (Bottom) */}
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center gap-[10px] pt-[20px] pb-4">
           {[0, 1, 2].map(rowIndex => {
             const rowCapacity = FORMATIONS[battleState.playerFormation][battleState.playerFormationLevel][rowIndex];
             return (
               <div key={`player-row-${rowIndex}`} className="flex justify-center gap-2 h-[5.6rem] w-full">
                 {rowCapacity !== undefined && renderRow(battleState.playerUnits.filter(u => u.row === rowIndex), rowCapacity, false)}
               </div>
             );
           })}
        </div>
      </div>

      {/* Logs */}
      <div className="h-24 bg-black/80 border-t border-white/10 p-3 overflow-y-auto font-mono text-[10px] text-slate-400 shrink-0 z-50 relative">
        {battleState.logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>

      {/* Result Modal */}
      {showResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in-95 duration-300">
          <div className="bg-zinc-900 border border-gold/30 p-8 rounded-2xl text-center shadow-2xl max-w-sm w-full">
            <h2 className={`text-4xl font-bold mb-4 ${battleState.status === 'victory' ? 'text-gold' : 'text-slate-500'}`}>
              {battleState.status === 'victory' ? 'VICTORY' : 'DEFEAT'}
            </h2>
            <div className="flex justify-center gap-4 mt-8">
              <button 
                onClick={() => {
                  if (battleState.status === 'victory') onVictory();
                  else onDefeat();
                }}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg w-full"
              >
                CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to get element position
const getElementCenter = (id: string) => {
  const el = document.getElementById(`unit-${id}`);
  if (!el) return { x: 0, y: 0 };
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
};

const ProjectileRenderer: React.FC<{ projectile: Projectile }> = ({ projectile }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const start = getElementCenter(projectile.attackerId);
    const end = getElementCenter(projectile.targetId);
    
    // Interpolate
    const x = start.x + (end.x - start.x) * projectile.progress;
    const y = start.y + (end.y - start.y) * projectile.progress;
    
    // Calculate angle
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const rad = Math.atan2(dy, dx);
    const deg = rad * (180 / Math.PI);

    setPos({ x, y });
    setAngle(deg);
  }, [projectile.progress, projectile.attackerId, projectile.targetId]);

  if (pos.x === 0 && pos.y === 0 || projectile.progress < 0) return null;

  return (
    <div 
      className="absolute w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(255,215,0,0.8)] z-50"
      style={{ 
        left: pos.x, 
        top: pos.y, 
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        // Make it look like a projectile (arrow/comet)
        clipPath: 'polygon(0% 20%, 60% 20%, 100% 50%, 60% 80%, 0% 80%)'
      }}
    />
  );
}

const BattleUnitCard: React.FC<{ unit: BattleUnit, isEnemy: boolean }> = ({ unit, isEnemy }) => {
  const hpPercent = (unit.currentHp / unit.maxHp) * 100;
  const gaugePercent = (unit.currentGauge / ATTACK_GAUGE_MAX) * 100;

  return (
    <div 
      id={`unit-${unit.instanceId}`}
      className={`relative w-full h-[5.6rem] bg-zinc-900 rounded-lg border-2 transition-all duration-300 ${
      unit.isDead ? 'opacity-20 grayscale border-zinc-800' : 
      isEnemy ? 'border-red-900/50' : 'border-blue-900/50'
    } ${unit.isAttacking ? 'scale-110 z-20 shadow-[0_0_30px_rgba(255,255,255,0.5)]' : ''}`}>
      
      {/* Portrait */}
      <div 
        className="absolute inset-0 bg-cover bg-center rounded-md opacity-80"
        style={{ backgroundImage: `url("${unit.imageUrl}")` }}
      ></div>
      
      {/* Overlay Info */}
      <div className="absolute inset-0 flex flex-col justify-between p-1 z-10">
        {/* Top: Level & Name */}
        <div className="bg-black/60 backdrop-blur-sm rounded px-1 py-0.5 text-center">
          <div className="text-[8px] text-gold font-mono leading-none">Lv.{unit.level}</div>
          <div className="text-[10px] text-white font-bold leading-tight truncate">{unit.name}</div>
        </div>

        {/* Bottom: Bars */}
        <div className="flex flex-col gap-1 w-full">
          {/* HP Bar */}
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden border border-black/50 relative">
            <div 
              className={`h-full transition-all duration-300 ${isEnemy ? 'bg-red-500' : 'bg-green-500'}`} 
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
          {/* Gauge Bar */}
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden border border-black/50">
            <div 
              className="h-full bg-yellow-400 transition-all duration-100" 
              style={{ width: `${gaugePercent}%` }}
            ></div>
          </div>
          {/* HP Text */}
          <div className="text-[8px] text-white text-center font-mono leading-none drop-shadow-md">
            {Math.ceil(unit.currentHp)}
          </div>
        </div>
      </div>

      {/* Floating Text Container */}
      <div className="absolute inset-0 pointer-events-none overflow-visible z-30 flex items-center justify-center">
        {unit.floatingTexts.map(ft => (
          <div 
            key={ft.id}
            className="absolute animate-[floatUp_1s_ease-out_forwards] whitespace-nowrap"
            style={{ 
              transform: `translate(${ft.xOffset}px, ${ft.yOffset}px)`
            }}
          >
            <span className={`text-2xl font-black stroke-black drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] ${
              ft.type === 'damage' ? 'text-red-500' : 
              ft.type === 'heal' ? 'text-green-400' : 'text-yellow-400'
            }`} style={{ 
              textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' 
            }}>
              {ft.text}
            </span>
          </div>
        ))}
      </div>

      {/* Dead Overlay */}
      {unit.isDead && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <span className="material-symbols-outlined text-red-600 text-4xl font-bold">close</span>
        </div>
      )}

      {/* Skill Shout Overlay */}
      {unit.skillText && !unit.isDead && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-40 animate-in zoom-in slide-in-from-bottom-2 duration-200">
          <div className="bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 text-black font-black text-xs px-2 py-1 rounded shadow-[0_0_15px_rgba(234,179,8,0.8)] border border-yellow-300 whitespace-nowrap">
            {unit.skillText}
          </div>
        </div>
      )}
    </div>
  );
}
