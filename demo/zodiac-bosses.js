/**
 * zodiac-bosses.js —— 十二生肖 BOSS low-poly 模型库（H5 游戏专用）
 *
 * 用法：
 *   import { makeBoss_Rat, makeBoss_Ox, ..., pedestal, BOSS_LIST } from './zodiac-bosses.js';
 *   const boss = makeBoss_Rat();
 *   scene.add(boss);
 *   boss.position.set(x, y, z);
 *
 * 依赖：three.js ≥ 0.160
 * 每个 BOSS 都是 THREE.Group，材质全部 flatShading，骨骼几何 30~55 个基础体
 * 共享底盘函数 pedestal() 返回六棱柱石台 + 金边（参考原图）
 *
 * 颜色命名对应 `迭代优化过程.md` 已锁定决策：
 *   低多边形色块风 + 切面渐变 + 描边几何体
 *   —— 在 Three.js 里 = flatShading + 高金属度金属 + 程序化几何
 */

// ===== 配色（参考原图色相）=====
export const COL = {
  rat: 0x8b8b9e, ratDark: 0x6a6a7a,
  ox: 0x7a4a3a, oxDark: 0x5a3528,
  tiger: 0xe87a2c, tigerBlack: 0x1a1a1a, tigerBelly: 0xfff2dc,
  rabbit: 0xf5ede0, rabbitInner: 0xffc8d8,
  dragon: 0x4fc7e0, dragonBelly: 0xeaf6f8, dragonGold: 0xd4a849,
  snake: 0x6b3aa0, snakeDark: 0x4a2470,
  horse: 0xa83838, horseDark: 0x701e1e, horseMane: 0xff6b35,
  sheep: 0xf3ecd9, sheepHorn: 0x3b2618, sheepIce: 0x6cd4f7,
  monkey: 0xc9925a, monkeyFace: 0xf3c794, monkeyArmor: 0xc23a3a,
  roosterBody: 0xc94238, roosterBody2: 0x2464b8, roosterComb: 0xe63850,
  dog: 0xd9a36b, dogDark: 0x8a5a3a, dogScarf: 0xc0382e,
  pig: 0xf4b6b4, pigDark: 0xd28a88, pigArmor: 0xb8843a,
  gold: 0xd4a849, goldLite: 0xf6d77a,
  stone: 0x5a5e6e, stoneDark: 0x3a3e4d,
  grass: 0x3a8a4a,
  eye: 0x111111, eyeHi: 0xffffff
};

// ===== 通用工具 =====
function mat(c, o = {}) {
  return new THREE.MeshStandardMaterial({
    color: c, flatShading: true,
    metalness: o.metal ?? 0.15,
    roughness: o.rough ?? 0.78,
    emissive: o.em ?? 0x000000,
    emissiveIntensity: o.ei ?? 0
  });
}
const b = (w, h, d, c, o) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o));
const c = (rt, rb, h, s, color, o) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s || 8), mat(color, o));
const s = (r, color, o) => new THREE.Mesh(new THREE.SphereGeometry(r, 6, 5), mat(color, o));
const cn = (r, h, segs, color, o) => new THREE.Mesh(new THREE.ConeGeometry(r, h, segs || 6), mat(color, o));
const t = (r, tt, segs, color, o) => new THREE.Mesh(new THREE.TorusGeometry(r, tt, segs || 5, segs ? segs * 2 : 12), mat(color, o));
const gem = (sz, color, o) => new THREE.Mesh(new THREE.OctahedronGeometry(sz, 0), mat(color, { ...o, metal: 0.3, rough: 0.3, em: color, ei: 0.4 }));
function eyes(x, y, z) {
  const g = new THREE.Group();
  const eL = s(0.06, COL.eye); eL.position.set(x - 0.08, y, z); eL.scale.z = 1.3;
  const eR = s(0.06, COL.eye); eR.position.set(x + 0.08, y, z); eR.scale.z = 1.3;
  const hL = s(0.022, COL.eyeHi); hL.position.set(x - 0.07, y + 0.04, z + 0.06);
  const hR = s(0.022, COL.eyeHi); hR.position.set(x + 0.07, y + 0.04, z + 0.06);
  g.add(eL, eR, hL, hR);
  return g;
}

// ===== 共享底盘 =====
export function pedestal() {
  const g = new THREE.Group();
  const top = c(1.55, 1.55, 0.32, 6, COL.stone); top.position.y = -0.16;
  const mid = c(1.75, 1.85, 0.5, 6, COL.stoneDark); mid.position.y = -0.55;
  const rim = c(1.87, 1.87, 0.12, 6, COL.gold, { metal: 0.7, rough: 0.35 }); rim.position.y = -0.85;
  const bot = c(2.1, 2.1, 0.4, 6, COL.stoneDark); bot.position.y = -1.1;
  const gr = c(2.05, 2.05, 0.04, 8, COL.grass); gr.position.y = 0.01;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const r = 1.95;
    const rock = b(0.3 + Math.random() * 0.2, 0.18, 0.3 + Math.random() * 0.2, COL.stoneDark);
    rock.position.set(Math.cos(a) * r, 0.07, Math.sin(a) * r);
    rock.rotation.y = Math.random() * Math.PI;
    g.add(rock);
  }
  g.add(top, mid, rim, bot, gr);
  return g;
}

/* ========== 1. 子·鼠 ========== */
export function makeBoss_Rat(THREE) {
  const g = new THREE.Group();
  const body = b(0.85, 0.7, 1.05, COL.rat); body.position.set(0, 0.75, 0);
  const belly = b(0.5, 0.55, 0.5, 0xb8b8c8); belly.position.set(0, 0.7, 0.45);
  const head = b(0.62, 0.55, 0.55, COL.rat); head.position.set(0, 1.35, 0.45);
  const earL = b(0.22, 0.36, 0.06, COL.rat); earL.position.set(-0.28, 1.7, 0.42);
  const earR = b(0.22, 0.36, 0.06, COL.rat); earR.position.set(0.28, 1.7, 0.42);
  const innerL = b(0.14, 0.26, 0.04, 0xdd8898); innerL.position.set(-0.28, 1.7, 0.46);
  const innerR = b(0.14, 0.26, 0.04, 0xdd8898); innerR.position.set(0.28, 1.7, 0.46);
  const snout = b(0.28, 0.2, 0.16, 0xdd8898); snout.position.set(0, 1.2, 0.78);
  const nose = s(0.04, 0x440000); nose.position.set(0, 1.22, 0.88);
  const helmet = b(0.66, 0.34, 0.58, COL.gold, { metal: 0.7, rough: 0.3 }); helmet.position.set(0, 1.55, 0.45);
  const helmTop = b(0.5, 0.18, 0.5, COL.gold, { metal: 0.7, rough: 0.3 }); helmTop.position.set(0, 1.78, 0.45);
  const plume = cn(0.13, 0.45, 5, 0xdc2a2a); plume.position.set(0, 2.12, 0.45);
  const cape = b(0.7, 0.95, 0.05, 0xc02020); cape.position.set(0, 1.0, -0.55); cape.rotation.x = -0.18;
  const tail = c(0.08, 0.05, 1.2, 6, COL.rat); tail.position.set(0, 0.65, -0.8); tail.rotation.x = -1.1;
  const tailTip = c(0.06, 0.04, 0.4, 6, COL.rat); tailTip.position.set(0, 0.25, -1.1); tailTip.rotation.x = -0.6;
  const staff = c(0.06, 0.06, 1.6, 6, COL.gold, { metal: 0.85, rough: 0.2 });
  staff.position.set(0.55, 0.9, 0.3); staff.rotation.z = -0.35; staff.rotation.x = -0.1;
  const staffHead = b(0.18, 0.18, 0.18, COL.gold, { metal: 0.85, rough: 0.2 }); staffHead.position.set(0.95, 1.7, 0.3);
  g.add(body, belly, head, earL, earR, innerL, innerR, snout, nose, helmet, helmTop, plume, cape, tail, tailTip, staff, staffHead, eyes(0, 1.45, 0.72));
  return g;
}

/* ========== 2. 丑·牛 ========== */
export function makeBoss_Ox(THREE) {
  const g = new THREE.Group();
  const body = b(1.7, 1.3, 1.9, COL.ox); body.position.set(0, 0.85, 0);
  const head = b(0.95, 0.95, 0.95, COL.ox); head.position.set(0, 1.6, 0.65);
  const snout = b(0.55, 0.5, 0.45, COL.oxDark); snout.position.set(0, 1.3, 1.05);
  const ring = t(0.15, 0.04, 4, COL.gold, { metal: 0.85, rough: 0.2 }); ring.position.set(0, 1.25, 1.28);
  const hornL = cn(0.16, 0.9, 5, 0xf0e3c2); hornL.position.set(-0.5, 2.05, 0.55); hornL.rotation.z = 0.55; hornL.rotation.x = -0.25;
  const hornR = cn(0.16, 0.9, 5, 0xf0e3c2); hornR.position.set(0.5, 2.05, 0.55); hornR.rotation.z = -0.55; hornR.rotation.x = -0.25;
  const frill = b(0.85, 0.32, 0.18, COL.gold, { metal: 0.7, rough: 0.3 }); frill.position.set(0, 1.85, 0.95);
  const breast = b(1.5, 0.55, 0.15, 0xb02020); breast.position.set(0, 1.15, 0.95);
  const breastG = b(1.5, 0.12, 0.18, COL.gold, { metal: 0.7, rough: 0.3 }); breastG.position.set(0, 1.45, 0.96);
  const padL = b(0.5, 0.4, 0.5, 0xb02020); padL.position.set(-0.95, 1.55, 0.25);
  const padR = b(0.5, 0.4, 0.5, 0xb02020); padR.position.set(0.95, 1.55, 0.25);
  const link1 = t(0.22, 0.05, 4, 0x888888, { metal: 0.8, rough: 0.3 }); link1.position.set(0.7, 0.85, 0.95); link1.rotation.y = Math.PI / 2;
  const link2 = t(0.18, 0.05, 4, 0x888888, { metal: 0.8, rough: 0.3 }); link2.position.set(0.95, 0.7, 0.7); link2.rotation.set(0.3, 0.5, -0.4);
  const legPos = [[-0.55, 0.7], [0.55, 0.7], [-0.55, -0.7], [0.55, -0.7]];
  const legs = legPos.map(([x, z]) => { const l = b(0.35, 0.7, 0.35, COL.oxDark); l.position.set(x, 0.35, z); return l; });
  g.add(body, head, snout, ring, hornL, hornR, frill, breast, breastG, padL, padR, link1, link2, ...legs, eyes(0, 1.7, 1.12));
  return g;
}

/* ========== 3. 寅·虎 ========== */
export function makeBoss_Tiger(THREE) {
  const g = new THREE.Group();
  const body = b(1.4, 0.9, 1.9, COL.tiger); body.position.set(0, 0.7, 0);
  for (let i = 0; i < 3; i++) {
    const sF = b(1.45, 0.12, 0.04, COL.tigerBlack); sF.position.set(0, 0.75 + i * 0.22, 0.95);
    const sB = b(1.45, 0.12, 0.04, COL.tigerBlack); sB.position.set(0, 0.75 + i * 0.22, -0.95);
    g.add(sF, sB);
  }
  const belly = b(0.7, 0.7, 1.8, COL.tigerBelly); belly.position.set(0, 0.7, 0);
  const head = b(0.95, 0.85, 0.85, COL.tiger); head.position.set(0, 1.35, 0.95);
  const snout = b(0.5, 0.4, 0.35, COL.tigerBelly); snout.position.set(0, 1.05, 1.45);
  const earL = cn(0.18, 0.32, 4, COL.tiger); earL.position.set(-0.4, 1.85, 0.95); earL.rotation.z = -0.4;
  const earR = cn(0.18, 0.32, 4, COL.tiger); earR.position.set(0.4, 1.85, 0.95); earR.rotation.z = 0.4;
  const iEarL = cn(0.1, 0.2, 4, 0x332222); iEarL.position.set(-0.45, 1.85, 1.0); iEarL.rotation.z = -0.4;
  const iEarR = cn(0.1, 0.2, 4, 0x332222); iEarR.position.set(0.45, 1.85, 1.0); iEarR.rotation.z = 0.4;
  const frill = b(0.55, 0.12, 0.05, 0xdc2a2a); frill.position.set(0, 1.7, 1.2);
  const tail = c(0.1, 0.08, 1.4, 6, COL.tiger); tail.position.set(0, 0.95, -1.15); tail.rotation.x = 1.2;
  const tailTip = b(0.18, 0.18, 0.05, COL.tigerBelly); tailTip.position.set(0, 1.65, -0.45); tailTip.rotation.x = 0.4;
  const legPos = [[-0.45, 0.75], [0.45, 0.75], [-0.45, -0.75], [0.45, -0.75]];
  const legs = legPos.map(([x, z]) => { const l = b(0.32, 0.8, 0.32, COL.tiger); l.position.set(x, 0.4, z); return l; });
  const scarf = b(0.4, 0.6, 0.04, 0xb02020); scarf.position.set(0, 1.4, 1.5);
  const leafL = cn(0.2, 0.45, 4, COL.grass); leafL.position.set(-0.7, 1.55, 0.65); leafL.rotation.z = -0.5; leafL.rotation.x = -0.4;
  const leafR = cn(0.2, 0.45, 4, COL.grass); leafR.position.set(0.7, 1.55, 0.65); leafR.rotation.z = 0.5; leafR.rotation.x = -0.4;
  g.add(body, belly, head, snout, earL, earR, iEarL, iEarR, frill, tail, tailTip, ...legs, scarf, leafL, leafR, eyes(0, 1.45, 1.35));
  return g;
}

/* ========== 4. 卯·兔 ========== */
export function makeBoss_Rabbit(THREE) {
  const g = new THREE.Group();
  const body = b(0.9, 0.85, 0.95, COL.rabbit); body.position.set(0, 0.85, 0);
  const head = s(0.5, COL.rabbit); head.position.set(0, 1.5, 0.1);
  const earL = b(0.14, 0.85, 0.06, COL.rabbit); earL.position.set(-0.18, 2.05, 0.05); earL.rotation.z = -0.15;
  const earR = b(0.14, 0.85, 0.06, COL.rabbit); earR.position.set(0.18, 2.05, 0.05); earR.rotation.z = 0.15;
  const iEarL = b(0.08, 0.7, 0.04, COL.rabbitInner); iEarL.position.set(-0.2, 2.05, 0.08); iEarL.rotation.z = -0.15;
  const iEarR = b(0.08, 0.7, 0.04, COL.rabbitInner); iEarR.position.set(0.2, 2.05, 0.08); iEarR.rotation.z = 0.15;
  const cheekL = s(0.1, 0xffb6c1); cheekL.position.set(-0.32, 1.4, 0.42);
  const cheekR = s(0.1, 0xffb6c1); cheekR.position.set(0.32, 1.4, 0.42);
  const nose = s(0.05, 0xdd6688); nose.position.set(0, 1.42, 0.62);
  const hood = b(0.85, 0.55, 0.85, 0x2f8c4a); hood.position.set(0, 1.45, 0.1);
  const cap = b(0.7, 0.45, 0.7, 0x2f8c4a); cap.position.set(0, 1.85, 0.1);
  const cape = b(0.9, 1.0, 0.1, 0x2f8c4a); cape.position.set(0, 0.7, -0.5);
  const staff = c(0.05, 0.05, 1.7, 6, 0xc8a050, { metal: 0.7 }); staff.position.set(0.55, 0.95, 0.3); staff.rotation.z = -0.2;
  const moonShape = new THREE.Shape();
  moonShape.absarc(0, 0, 0.22, 0.2, Math.PI - 0.2, false);
  moonShape.absarc(0.05, 0, 0.16, Math.PI - 0.2, 0.2, true);
  const moonGeo = new THREE.ExtrudeGeometry(moonShape, { depth: 0.08, bevelEnabled: false });
  const moon = new THREE.Mesh(moonGeo, mat(0xd0e8c0, { metal: 0.6, em: 0xa8e8b0, ei: 0.5 }));
  moon.position.set(0.85, 1.95, 0.3); moon.rotation.z = 0.3;
  const tail = s(0.18, COL.rabbit); tail.position.set(0, 0.7, -0.5);
  g.add(body, head, earL, earR, iEarL, iEarR, cheekL, cheekR, nose, hood, cap, cape, staff, moon, tail, eyes(0, 1.55, 0.55));
  return g;
}

/* ========== 5. 辰·龙 ========== */
export function makeBoss_Dragon(THREE) {
  const g = new THREE.Group();
  const segs = [];
  const path = [];
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const x = Math.sin(t * Math.PI) * 0.9;
    const y = 0.55 + Math.sin(t * Math.PI) * 0.6;
    const z = 0.55 - t * 0.6;
    path.push({ x, y, z });
  }
  path.forEach((p, i) => {
    const r = 0.42 - i * 0.04;
    const seg = s(r + 0.1, COL.dragon); seg.scale.set(1.1, 0.95, 1.0); seg.position.set(p.x, p.y, p.z);
    segs.push(seg);
    const bel = b(0.5, 0.15, 0.5, COL.dragonBelly); bel.position.set(p.x, p.y - 0.15, p.z);
    g.add(bel);
  });
  const last = path[path.length - 1];
  const head = b(0.75, 0.7, 0.75, COL.dragon); head.position.set(last.x, last.y + 0.15, last.z + 0.3);
  const hornL = cn(0.1, 0.5, 5, COL.dragonGold, { metal: 0.7 }); hornL.position.set(last.x - 0.25, head.position.y + 0.55, last.z + 0.3); hornL.rotation.z = 0.4;
  const hornR = cn(0.1, 0.5, 5, COL.dragonGold, { metal: 0.7 }); hornR.position.set(last.x + 0.25, head.position.y + 0.55, last.z + 0.3); hornR.rotation.z = -0.4;
  const whi1 = c(0.03, 0.02, 0.6, 5, COL.dragonBelly); whi1.position.set(head.position.x - 0.1, head.position.y - 0.2, head.position.z + 0.5); whi1.rotation.set(-0.7, 0, 0.5);
  const whi2 = c(0.03, 0.02, 0.6, 5, COL.dragonBelly); whi2.position.set(head.position.x + 0.1, head.position.y - 0.2, head.position.z + 0.5); whi2.rotation.set(-0.7, 0, -0.5);
  const jaw = b(0.5, 0.15, 0.2, COL.dragonBelly); jaw.position.set(head.position.x, head.position.y - 0.3, head.position.z + 0.55);
  const orb = gem(0.22, COL.gold, { em: 0xffaa44, ei: 0.8, metal: 0.85, rough: 0.15 });
  orb.position.set(head.position.x, head.position.y - 0.5, head.position.z + 0.85);
  const wingL = b(0.7, 0.4, 0.05, COL.dragon); wingL.position.set(head.position.x - 0.7, head.position.y + 0.3, last.z - 0.1);
  wingL.rotation.z = 0.4; wingL.rotation.x = 0.3;
  const wingR = b(0.7, 0.4, 0.05, COL.dragon); wingR.position.set(head.position.x + 0.7, head.position.y + 0.3, last.z - 0.1);
  wingR.rotation.z = -0.4; wingR.rotation.x = 0.3;
  const tip = cn(0.15, 0.5, 5, COL.dragon); tip.position.set(path[0].x, path[0].y + 0.4, path[0].z - 0.3); tip.rotation.x = 1.2;
  const cloud = b(1.6, 0.35, 1.6, COL.dragonBelly); cloud.position.set(0, -0.4, 0);
  const cl2 = b(0.8, 0.5, 0.8, COL.dragonBelly); cl2.position.set(0.3, -0.2, 0.3);
  g.add(...segs, head, hornL, hornR, whi1, whi2, jaw, orb, wingL, wingR, tip, cloud, cl2, eyes(head.position.x, head.position.y + 0.05, head.position.z + 0.42));
  return g;
}

/* ========== 6. 巳·蛇 ========== */
export function makeBoss_Snake(THREE) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const r = 0.55 - i * 0.05;
    const h = 0.45 - i * 0.04;
    const seg = t(r, 0.18, 5, COL.snake);
    seg.position.set(0, h, 0); seg.rotation.x = Math.PI / 2;
    seg.rotation.z = 0.4 - i * 0.15;
    g.add(seg);
  }
  const orb = gem(0.28, 0x9040d0, { em: 0xc060ff, ei: 0.7 }); orb.position.set(0, 0.5, 0);
  const hood = cn(0.7, 1.0, 5, COL.snake); hood.position.set(0, 1.6, 0);
  const head = b(0.45, 0.35, 0.4, COL.snakeDark); head.position.set(0, 2.05, 0);
  const hoodBack = b(0.85, 0.7, 0.1, COL.snakeDark); hoodBack.position.set(0, 1.7, -0.35);
  const eL = s(0.08, 0xff44ff, { em: 0xff44ff, ei: 1 }); eL.position.set(-0.15, 2.05, 0.25);
  const eR = s(0.08, 0xff44ff, { em: 0xff44ff, ei: 1 }); eR.position.set(0.15, 2.05, 0.25);
  const ton1 = b(0.04, 0.04, 0.4, 0xff3399); ton1.position.set(0, 1.85, 0.4);
  const ton2 = b(0.04, 0.04, 0.4, 0xff3399); ton2.position.set(-0.08, 1.83, 0.42); ton2.rotation.x = 0.5;
  const ton3 = b(0.04, 0.04, 0.4, 0xff3399); ton3.position.set(0.08, 1.83, 0.42); ton3.rotation.x = -0.5;
  g.add(hood, hoodBack, head, orb, eL, eR, ton1, ton2, ton3);
  return g;
}

/* ========== 7. 午·马 ========== */
export function makeBoss_Horse(THREE) {
  const g = new THREE.Group();
  const body = b(1.3, 1.0, 1.9, COL.horse); body.position.set(0, 1.3, 0);
  const neck = b(0.6, 1.0, 0.6, COL.horse); neck.position.set(0, 2.05, 0.85); neck.rotation.x = -0.5;
  const head = b(0.55, 0.55, 0.85, COL.horse); head.position.set(0, 2.45, 1.35);
  const snout = b(0.42, 0.4, 0.6, COL.horseDark); snout.position.set(0, 2.25, 1.85);
  for (let i = 0; i < 5; i++) {
    const m = cn(0.12, 0.8 + i * 0.05, 5, COL.horseMane);
    m.position.set(0, 2.25 + i * 0.05, 0.55 - i * 0.04);
    m.rotation.x = -0.5 - i * 0.05;
    g.add(m);
  }
  const earL = cn(0.1, 0.3, 4, COL.horseDark); earL.position.set(-0.18, 2.85, 1.25); earL.rotation.z = 0.3;
  const earR = cn(0.1, 0.3, 4, COL.horseDark); earR.position.set(0.18, 2.85, 1.25); earR.rotation.z = -0.3;
  const mane = cn(0.25, 1.8, 4, COL.horseMane); mane.position.set(0, 2.2, 0.45); mane.rotation.x = -0.7;
  const legPos = [[-0.45, 0.85], [0.45, 0.85], [-0.45, -0.85], [0.45, -0.85]];
  const legs = legPos.map(([x, z]) => { const l = b(0.3, 0.8, 0.3, COL.horseDark); l.position.set(x, 0.4, z); return l; });
  const flames = legPos.map(([x, z]) => {
    const f = cn(0.25, 0.55, 5, 0xff6b35, { em: 0xff6b35, ei: 0.6 });
    f.position.set(x, 0.1, z); return f;
  });
  const tail = cn(0.15, 1.4, 5, COL.horseMane); tail.position.set(0, 1.6, -1.2); tail.rotation.x = 1.6;
  const frill = b(0.4, 0.1, 0.05, COL.gold, { metal: 0.7 }); frill.position.set(0, 2.85, 1.5);
  g.add(body, neck, head, snout, mane, tail, earL, earR, frill, ...legs, ...flames, eyes(0, 2.55, 1.7));
  return g;
}

/* ========== 8. 未·羊 ========== */
export function makeBoss_Goat(THREE) {
  const g = new THREE.Group();
  const body = b(1.3, 1.1, 1.5, COL.sheep); body.position.set(0, 0.95, 0);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const p = s(0.3, COL.sheep); p.position.set(Math.cos(a) * 0.6, 0.95 + Math.sin(a) * 0.3, Math.sin(a) * 0.7);
    g.add(p);
  }
  const head = b(0.7, 0.7, 0.75, COL.sheepHorn); head.position.set(0, 1.55, 0.85);
  const snout = b(0.42, 0.35, 0.35, 0x2a1a10); snout.position.set(0, 1.3, 1.25);
  const hornShape = new THREE.Shape();
  hornShape.absarc(0, 0, 0.45, 0, Math.PI, true);
  hornShape.absarc(0, 0.15, 0.32, Math.PI, 0, false);
  const hornGeo = new THREE.ExtrudeGeometry(hornShape, { depth: 0.12, bevelEnabled: false });
  const hornL = new THREE.Mesh(hornGeo, mat(COL.sheepHorn, { metal: 0.5 })); hornL.position.set(-0.4, 1.7, 0.85); hornL.rotation.y = Math.PI / 2;
  const hornR = hornL.clone(); hornR.position.x = 0.4;
  const fringe = b(0.5, 0.15, 0.05, COL.sheep); fringe.position.set(0, 1.8, 1.2);
  const legPos = [[-0.45, 0.6], [0.45, 0.6], [-0.45, -0.6], [0.45, -0.6]];
  const legs = legPos.map(([x, z]) => { const l = b(0.28, 0.85, 0.28, 0x2a1a10); l.position.set(x, 0.4, z); return l; });
  const gem1 = gem(0.18, COL.sheepIce, { em: 0x6cd4f7, ei: 0.8 }); gem1.position.set(0, 2.05, 0.85);
  const gem2 = gem(0.15, COL.sheepIce, { em: 0x6cd4f7, ei: 0.8 }); gem2.position.set(0.8, 0.5, 0.5);
  const gem3 = gem(0.15, COL.sheepIce, { em: 0x6cd4f7, ei: 0.8 }); gem3.position.set(-0.8, 0.5, -0.5);
  g.add(body, head, snout, hornL, hornR, fringe, ...legs, gem1, gem2, gem3, eyes(0, 1.65, 1.22));
  return g;
}

/* ========== 9. 申·猴 ========== */
export function makeBoss_Monkey(THREE) {
  const g = new THREE.Group();
  const body = b(0.95, 1.0, 0.85, COL.monkey); body.position.set(0, 1.0, 0);
  const breast = b(0.85, 0.75, 0.1, COL.gold, { metal: 0.7 }); breast.position.set(0, 1.0, 0.45);
  const belt = b(0.95, 0.18, 0.88, COL.monkeyArmor); belt.position.set(0, 0.55, 0);
  const head = b(0.75, 0.75, 0.75, COL.monkeyFace); head.position.set(0, 1.85, 0);
  const band = t(0.4, 0.08, 5, COL.gold, { metal: 0.85, rough: 0.2 });
  band.position.set(0, 1.95, 0); band.rotation.x = Math.PI / 2;
  const gemC = s(0.08, 0xff4444, { em: 0xff4444, ei: 0.7, metal: 0.6 }); gemC.position.set(0, 1.95, 0.42);
  const earL = b(0.18, 0.22, 0.06, COL.monkeyFace); earL.position.set(-0.42, 1.95, 0);
  const earR = b(0.18, 0.22, 0.06, COL.monkeyFace); earR.position.set(0.42, 1.95, 0);
  const iEarL = b(0.1, 0.14, 0.04, 0xc98450); iEarL.position.set(-0.45, 1.95, 0.04);
  const iEarR = b(0.1, 0.14, 0.04, 0xc98450); iEarR.position.set(0.45, 1.95, 0.04);
  const tail = c(0.07, 0.06, 1.6, 6, COL.monkey); tail.position.set(0, 0.65, -0.7); tail.rotation.x = -0.8;
  const tailTip = c(0.05, 0.04, 0.3, 6, COL.monkey); tailTip.position.set(0, 0.0, -1.2); tailTip.rotation.x = -0.3;
  const legPos = [[-0.32, 0.35], [0.32, 0.35], [-0.32, -0.35], [0.32, -0.35]];
  const legs = legPos.map(([x, z]) => { const l = b(0.28, 0.5, 0.28, COL.monkey); l.position.set(x, 0.25, z); return l; });
  const cloud = b(1.5, 0.4, 1.2, 0xeaf2f8); cloud.position.set(0, -0.2, 0);
  const cl2 = b(0.9, 0.5, 0.7, 0xeaf2f8); cl2.position.set(0.25, -0.05, 0.2);
  const cl3 = b(0.6, 0.4, 0.5, 0xeaf2f8); cl3.position.set(-0.3, -0.1, -0.1);
  const staff = c(0.06, 0.06, 1.5, 6, COL.gold, { metal: 0.85, rough: 0.2 });
  staff.position.set(0.7, 1.4, 0.2); staff.rotation.z = -0.4; staff.rotation.x = -0.1;
  const staffHead = b(0.2, 0.2, 0.2, COL.gold, { metal: 0.85, rough: 0.2 }); staffHead.position.set(1.05, 2.1, 0.15);
  g.add(body, breast, belt, head, band, gemC, earL, earR, iEarL, iEarR, tail, tailTip, ...legs, cloud, cl2, cl3, staff, staffHead, eyes(0, 1.95, 0.42));
  return g;
}

/* ========== 10. 酉·鸡 ========== */
export function makeBoss_Rooster(THREE) {
  const g = new THREE.Group();
  const body = b(0.95, 0.95, 0.9, COL.roosterBody); body.position.set(0, 0.9, 0);
  const breast = b(0.7, 0.7, 0.5, 0xe88040); breast.position.set(0, 0.95, 0.4);
  const head = b(0.55, 0.55, 0.55, 0xe88040); head.position.set(0, 1.65, 0.1);
  const comb1 = b(0.18, 0.18, 0.1, COL.roosterComb); comb1.position.set(0, 2.0, 0.05);
  const comb2 = b(0.12, 0.14, 0.08, COL.roosterComb); comb2.position.set(-0.15, 1.95, 0.05);
  const comb3 = b(0.12, 0.14, 0.08, COL.roosterComb); comb3.position.set(0.15, 1.95, 0.05);
  const beak = cn(0.12, 0.3, 4, COL.gold, { metal: 0.7 }); beak.position.set(0, 1.65, 0.45); beak.rotation.x = Math.PI / 2;
  const eLwrap = b(0.13, 0.13, 0.04, 0xffffff); eLwrap.position.set(-0.18, 1.7, 0.32);
  const eRwrap = b(0.13, 0.13, 0.04, 0xffffff); eRwrap.position.set(0.18, 1.7, 0.32);
  const wingL = b(0.15, 0.7, 0.55, COL.roosterBody2); wingL.position.set(-0.55, 0.95, 0);
  const wingR = b(0.15, 0.7, 0.55, COL.roosterBody2); wingR.position.set(0.55, 0.95, 0);
  const palette = [COL.roosterComb, 0xff8c2a, COL.gold, COL.roosterBody2, 0x2a8cdc, 0x8c4ed8, 0x188040];
  for (let i = 0; i < 7; i++) {
    const t = i / 6 - 0.5;
    const f = b(0.18, 0.7, 0.04, palette[i]);
    f.position.set(t * 0.5, 1.1, -1.1);
    f.rotation.x = -0.7;
    f.rotation.y = t * 0.6;
    g.add(f);
  }
  const legs = [[-0.18, 0.15], [0.18, 0.15]].map(([x, z]) => {
    const l = b(0.1, 0.6, 0.1, COL.gold, { metal: 0.6 }); l.position.set(x, 0.3, z); return l;
  });
  const perch = b(0.85, 0.25, 0.55, 0x6a3a18); perch.position.set(0, -0.1, 0);
  const perchG = b(0.88, 0.08, 0.58, COL.gold, { metal: 0.7 }); perchG.position.set(0, 0.02, 0);
  const gemT = gem(0.12, COL.roosterComb, { em: COL.roosterComb, ei: 0.7 }); gemT.position.set(0, 0.15, 0);
  g.add(body, breast, head, comb1, comb2, comb3, beak, eLwrap, eRwrap, wingL, wingR, ...legs, perch, perchG, gemT, eyes(0, 1.75, 0.4));
  return g;
}

/* ========== 11. 戌·狗 ========== */
export function makeBoss_Dog(THREE) {
  const g = new THREE.Group();
  const body = b(0.95, 0.85, 1.5, COL.dog); body.position.set(0, 0.9, 0);
  const head = b(0.85, 0.85, 0.85, COL.dog); head.position.set(0, 1.55, 0.5);
  const snout = b(0.55, 0.5, 0.6, COL.dog); snout.position.set(0, 1.35, 1.05);
  const noseTip = s(0.08, 0x222); noseTip.position.set(0, 1.35, 1.4);
  const earL = cn(0.18, 0.45, 4, COL.dogDark); earL.position.set(-0.35, 2.05, 0.45); earL.rotation.z = 0.25;
  const earR = cn(0.18, 0.45, 4, COL.dogDark); earR.position.set(0.35, 2.05, 0.45); earR.rotation.z = -0.25;
  const iEarL = cn(0.1, 0.3, 4, 0xff8866); iEarL.position.set(-0.38, 2.0, 0.5); iEarL.rotation.z = 0.25;
  const iEarR = cn(0.1, 0.3, 4, 0xff8866); iEarR.position.set(0.38, 2.0, 0.5); iEarR.rotation.z = -0.25;
  const scarf = t(0.45, 0.12, 5, COL.dogScarf); scarf.position.set(0, 1.85, 0.5); scarf.rotation.x = Math.PI / 2;
  const scarfTail = b(0.18, 0.5, 0.04, COL.dogScarf); scarfTail.position.set(-0.4, 1.45, 0.55); scarfTail.rotation.z = 0.4;
  const gourd = b(0.32, 0.45, 0.32, 0xb2681a); gourd.position.set(0.55, 0.75, 0.4);
  const gourdNeck = b(0.18, 0.18, 0.18, 0xb2681a); gourdNeck.position.set(0.55, 1.05, 0.4);
  const gourdTop = b(0.08, 0.12, 0.08, 0x6a3c10); gourdTop.position.set(0.55, 1.18, 0.4);
  const legPos = [[-0.32, 0.6], [0.32, 0.6], [-0.32, -0.6], [0.32, -0.6]];
  const legs = legPos.map(([x, z]) => { const l = b(0.28, 0.85, 0.28, COL.dogDark); l.position.set(x, 0.45, z); return l; });
  const tail = c(0.1, 0.08, 0.8, 6, COL.dogDark); tail.position.set(0, 1.2, -1.0); tail.rotation.x = -1.4;
  const tailTip = c(0.07, 0.05, 0.4, 6, COL.dog); tailTip.position.set(0, 0.7, -1.55); tailTip.rotation.x = 0.6;
  g.add(body, head, snout, noseTip, earL, earR, iEarL, iEarR, scarf, scarfTail, gourd, gourdNeck, gourdTop, ...legs, tail, tailTip, eyes(0, 1.65, 1.0));
  return g;
}

/* ========== 12. 亥·猪 ========== */
export function makeBoss_Pig(THREE) {
  const g = new THREE.Group();
  const body = b(1.4, 1.2, 1.5, COL.pig); body.position.set(0, 0.95, 0);
  const belly = b(0.9, 0.85, 0.6, 0xfacdd0); belly.position.set(0, 0.95, 0.55);
  const head = b(0.85, 0.8, 0.85, COL.pig); head.position.set(0, 1.7, 0.5);
  const snout = b(0.55, 0.5, 0.4, COL.pigDark); snout.position.set(0, 1.5, 1.05);
  const nostrilL = c(0.04, 0.04, 0.1, 4, 0x440000); nostrilL.position.set(-0.1, 1.5, 1.27); nostrilL.rotation.x = Math.PI / 2;
  const nostrilR = c(0.04, 0.04, 0.1, 4, 0x440000); nostrilR.position.set(0.1, 1.5, 1.27); nostrilR.rotation.x = Math.PI / 2;
  const eyeL = b(0.1, 0.06, 0.04, COL.eye); eyeL.position.set(-0.2, 1.8, 0.94);
  const eyeR = b(0.1, 0.06, 0.04, COL.eye); eyeR.position.set(0.2, 1.8, 0.94);
  const band = t(0.42, 0.07, 5, COL.gold, { metal: 0.85, rough: 0.2 });
  band.position.set(0, 2.0, 0.5); band.rotation.x = Math.PI / 2 + 0.3;
  const earL = b(0.16, 0.22, 0.04, COL.pigDark); earL.position.set(-0.42, 2.05, 0.5); earL.rotation.z = 0.6;
  const earR = b(0.16, 0.22, 0.04, COL.pigDark); earR.position.set(0.42, 2.05, 0.5); earR.rotation.z = -0.6;
  const legPos = [[-0.42, 0.55], [0.42, 0.55], [-0.42, -0.55], [0.42, -0.55]];
  const legs = legPos.map(([x, z]) => { const l = b(0.3, 0.55, 0.3, COL.pigDark); l.position.set(x, 0.28, z); return l; });
  const rake = c(0.06, 0.06, 1.6, 6, 0xc18a3e, { metal: 0.7 }); rake.position.set(0.85, 1.0, 0.2); rake.rotation.z = -0.3;
  for (let i = -1; i <= 1; i++) {
    const tt = cn(0.03, 0.35, 3, 0xc18a3e, { metal: 0.7 });
    tt.position.set(1.45, 0.3 + i * 0.18, 0.2); tt.rotation.z = -0.3;
    g.add(tt);
  }
  const tail = c(0.06, 0.04, 0.4, 5, COL.pigDark); tail.position.set(0, 1.25, -0.85); tail.rotation.x = 0.8;
  g.add(body, belly, head, snout, nostrilL, nostrilR, eyeL, eyeR, band, earL, earR, ...legs, rake, tail);
  return g;
}

/* ========== BOSS 列表 ========== */
export const BOSS_LIST = [
  { en: 'Rat',     zh: '子·鼠', fn: makeBoss_Rat },
  { en: 'Ox',      zh: '丑·牛', fn: makeBoss_Ox },
  { en: 'Tiger',   zh: '寅·虎', fn: makeBoss_Tiger },
  { en: 'Rabbit',  zh: '卯·兔', fn: makeBoss_Rabbit },
  { en: 'Dragon',  zh: '辰·龙', fn: makeBoss_Dragon },
  { en: 'Snake',   zh: '巳·蛇', fn: makeBoss_Snake },
  { en: 'Horse',   zh: '午·马', fn: makeBoss_Horse },
  { en: 'Goat',    zh: '未·羊', fn: makeBoss_Goat },
  { en: 'Monkey',  zh: '申·猴', fn: makeBoss_Monkey },
  { en: 'Rooster', zh: '酉·鸡', fn: makeBoss_Rooster },
  { en: 'Dog',     zh: '戌·狗', fn: makeBoss_Dog },
  { en: 'Pig',     zh: '亥·猪', fn: makeBoss_Pig }
];

/* ========== 一键接入示例（用 ES module）==========
import * as THREE from 'three';
import { makeBoss_Rat, BOSS_LIST, pedestal } from './zodiac-bosses.js';

const scene = new THREE.Scene();
const boss = makeBoss_Rat(THREE);    // 传入 THREE 引用（避免循环依赖）
const ped = pedestal();
boss.add(ped);
scene.add(boss);
boss.position.set(0, 0, 0);

// 批量（中心 12 生肖围一圈）
BOSS_LIST.forEach((b, i) => {
  const angle = (i / 12) * Math.PI * 2;
  const obj = b.fn(THREE);
  obj.add(pedestal());
  obj.position.set(Math.cos(angle) * 8, 0, Math.sin(angle) * 8);
  obj.rotation.y = -angle + Math.PI / 2;
  scene.add(obj);
});
*/
