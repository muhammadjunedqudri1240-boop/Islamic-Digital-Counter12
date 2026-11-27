import { getTheme } from "./themes";

export interface ReceiptData {
  userName: string;
  zikrName: string;
  count: number;
  target: number;
  targetCompleted: boolean;
  date: string;
  time: string;
  duration: number;
  themeId: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawGeometricPattern(ctx: CanvasRenderingContext2D, color: string, canvasW: number, canvasH: number) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const spacing = 60;
  for (let x = 0; x < canvasW; x += spacing) {
    for (let y = 0; y < canvasH; y += spacing) {
      ctx.beginPath();
      ctx.arc(x, y, spacing * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - spacing * 0.4, y);
      ctx.lineTo(x + spacing * 0.4, y);
      ctx.moveTo(x, y - spacing * 0.4);
      ctx.lineTo(x, y + spacing * 0.4);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawStarPattern(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, alpha: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const points = 8;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.4;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function generateReceiptCanvas(data: ReceiptData): HTMLCanvasElement {
  const W = 800;
  const H = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(2, 2);

  const theme = getTheme(data.themeId);
  const primaryColor = theme.id === "golden" || theme.id === "makkah" ? "#d4a017" :
    theme.id === "madinah" ? "#22aa50" :
    theme.id === "dark-luxury" ? "#8b5cf6" :
    "#10b981";

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#0a0a0a");
  bgGrad.addColorStop(0.5, "#111111");
  bgGrad.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  drawGeometricPattern(ctx, primaryColor, W, H);

  drawStarPattern(ctx, 80, 80, 55, primaryColor, 0.15);
  drawStarPattern(ctx, W - 80, 80, 55, primaryColor, 0.15);
  drawStarPattern(ctx, 80, H - 80, 55, primaryColor, 0.15);
  drawStarPattern(ctx, W - 80, H - 80, 55, primaryColor, 0.15);
  drawStarPattern(ctx, W / 2, 50, 35, primaryColor, 0.12);

  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, primaryColor);
  borderGrad.addColorStop(0.5, "rgba(255,255,255,0.2)");
  borderGrad.addColorStop(1, primaryColor);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, 20, 20, W - 40, H - 40, 20);
  ctx.stroke();

  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, 28, 28, W - 56, H - 56, 16);
  ctx.stroke();

  const headerGrad = ctx.createLinearGradient(0, 60, 0, 200);
  headerGrad.addColorStop(0, `${primaryColor}33`);
  headerGrad.addColorStop(1, "transparent");
  ctx.fillStyle = headerGrad;
  drawRoundedRect(ctx, 40, 60, W - 80, 160, 12);
  ctx.fill();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 13px serif";
  ctx.letterSpacing = "4px";
  ctx.fillStyle = `${primaryColor}bb`;
  ctx.fillText("بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", W / 2, 98);
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 32px sans-serif";
  ctx.fillStyle = primaryColor;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 20;
  ctx.fillText("✦ Smart Tasbeeh Pro ✦", W / 2, 145);
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "13px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("ACHIEVEMENT CERTIFICATE", W / 2, 175);
  ctx.restore();

  let y = 260;

  if (data.userName) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("Completed by", W / 2, y);
    y += 30;
    ctx.font = "bold 28px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(data.userName, W / 2, y);
    y += 20;
    ctx.restore();
  }

  y += 20;

  const countGrad = ctx.createLinearGradient(W / 2 - 120, y - 20, W / 2 + 120, y + 80);
  countGrad.addColorStop(0, primaryColor);
  countGrad.addColorStop(1, `${primaryColor}88`);
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 80px monospace";
  ctx.fillStyle = countGrad;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 30;
  ctx.fillText(data.count.toLocaleString(), W / 2, y + 60);
  ctx.restore();

  y += 90;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "14px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText("TOTAL COUNT", W / 2, y);
  ctx.restore();

  y += 30;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 22px serif";
  ctx.fillStyle = primaryColor;
  ctx.shadowColor = primaryColor;
  ctx.shadowBlur = 10;
  ctx.fillText(`❝ ${data.zikrName} ❞`, W / 2, y);
  ctx.restore();

  y += 50;

  if (data.targetCompleted && data.target > 0) {
    const badgeGrad = ctx.createLinearGradient(W / 2 - 130, y - 20, W / 2 + 130, y + 30);
    badgeGrad.addColorStop(0, `${primaryColor}44`);
    badgeGrad.addColorStop(1, `${primaryColor}22`);
    ctx.save();
    drawRoundedRect(ctx, W / 2 - 130, y - 20, 260, 50, 25);
    ctx.fillStyle = badgeGrad;
    ctx.fill();
    ctx.strokeStyle = `${primaryColor}88`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.fillText(`🎯 Target ${data.target.toLocaleString()} — Achieved!`, W / 2, y + 12);
    ctx.restore();
    y += 70;
  }

  y += 10;

  ctx.strokeStyle = `${primaryColor}44`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(W - 60, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 30;

  const infoItems = [
    ["📅 Date", data.date],
    ["🕐 Time", data.time],
    ["⏱️ Duration", formatDuration(data.duration)],
    ["🎯 Target", data.target > 0 ? data.target.toLocaleString() : "No target"],
  ];

  const colW = (W - 120) / 2;
  for (let i = 0; i < infoItems.length; i += 2) {
    const col1 = infoItems[i];
    const col2 = infoItems[i + 1];

    ctx.save();
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.textAlign = "left";
    if (col1) ctx.fillText(col1[0], 70, y);
    if (col2) ctx.fillText(col2[0], 70 + colW + 20, y);

    y += 22;
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    if (col1) ctx.fillText(col1[1], 70, y);
    if (col2) ctx.fillText(col2[1], 70 + colW + 20, y);
    ctx.restore();

    y += 35;
  }

  y += 20;

  const progressW = W - 120;
  const progressH = 12;
  const px = 60;

  ctx.save();
  drawRoundedRect(ctx, px, y, progressW, progressH, progressH / 2);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fill();

  if (data.target > 0) {
    const pct = Math.min(data.count / data.target, 1);
    const fillGrad = ctx.createLinearGradient(px, y, px + progressW, y);
    fillGrad.addColorStop(0, primaryColor);
    fillGrad.addColorStop(1, `${primaryColor}88`);
    drawRoundedRect(ctx, px, y, progressW * pct, progressH, progressH / 2);
    ctx.fillStyle = fillGrad;
    ctx.fill();
  }
  ctx.restore();

  y += 40;

  ctx.strokeStyle = `${primaryColor}44`;
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(60, y);
  ctx.lineTo(W - 60, y);
  ctx.stroke();
  ctx.setLineDash([]);

  y += 30;

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "italic 13px serif";
  ctx.fillStyle = `${primaryColor}99`;
  ctx.fillText('"Every count is a step closer to Allah"', W / 2, y);
  y += 25;
  ctx.font = "italic 12px serif";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillText("Generated by Smart Tasbeeh Pro", W / 2, y);
  ctx.restore();

  return canvas;
}

export function downloadReceipt(data: ReceiptData, format: "png" | "jpeg" = "png") {
  const canvas = generateReceiptCanvas(data);
  const link = document.createElement("a");
  link.download = `tasbeeh-${data.zikrName.replace(/\s+/g, "-")}-${data.count}.${format}`;
  link.href = canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.95);
  link.click();
}

export async function shareReceipt(data: ReceiptData) {
  const canvas = generateReceiptCanvas(data);
  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], `tasbeeh-achievement.png`, { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: `${data.zikrName} — ${data.count} counts`,
        text: `I completed ${data.count} counts of ${data.zikrName}! 🤲`,
        files: [file],
      });
    } else {
      downloadReceipt(data);
    }
  }, "image/png");
}
