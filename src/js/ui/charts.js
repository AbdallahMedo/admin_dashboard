// Canvas charts use the same theme tokens as the dashboard.
const chartColor = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const chartRenders = new Map();
new MutationObserver(() => {
  for (const [id, render] of chartRenders) {
    if (document.getElementById(id)) render();
    else chartRenders.delete(id);
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

export function renderRevenueTimelineChart(canvasId, data = []) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  chartRenders.set(canvasId, () => renderRevenueTimelineChart(canvasId, data));
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 30, right: 30, bottom: 40, left: 60 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (data.length === 0) return;

  const maxRevenue = Math.max(1, ...data.map(d => d.revenue)) * 1.15;
  const minRevenue = 0;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw Horizontal Grid Lines
  const gridLines = 4;
  ctx.lineWidth = 1;
  ctx.strokeStyle = chartColor('--border-subtle');
  ctx.fillStyle = chartColor('--text-muted');
  ctx.font = '11px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= gridLines; i++) {
    const y = padding.top + (chartHeight / gridLines) * i;
    const value = Math.round(maxRevenue - (maxRevenue / gridLines) * i);

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillText(`$${(value / 1000).toFixed(1)}k`, padding.left - 10, y + 4);
  }

  // Calculate points
  const points = data.map((d, index) => {
    const x = padding.left + (chartWidth / Math.max(1, data.length - 1)) * index;
    const y = padding.top + chartHeight - ((d.revenue - minRevenue) / (maxRevenue - minRevenue)) * chartHeight;
    return { x, y, ...d };
  });

  // Draw smooth gradient area under curve
  const areaGradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  areaGradient.addColorStop(0, 'rgba(158, 125, 83, 0.35)');
  areaGradient.addColorStop(0.7, 'rgba(158, 125, 83, 0.08)');
  areaGradient.addColorStop(1, 'rgba(158, 125, 83, 0.0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
  ctx.lineTo(points[0].x, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = areaGradient;
  ctx.fill();

  // Draw Line
  ctx.beginPath();
  ctx.lineWidth = 3;
  ctx.strokeStyle = chartColor('--primary');
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.stroke();

  // Draw Points and X-Axis Labels
  ctx.textAlign = 'center';
  points.forEach((pt) => {
    // Point circle
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = chartColor('--primary');
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = chartColor('--bg-surface');
    ctx.stroke();

    // Value tooltip on point
    ctx.fillStyle = chartColor('--text-main');
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`$${pt.revenue.toLocaleString()}`, pt.x, pt.y - 12);

    // Month label
    ctx.fillStyle = chartColor('--text-muted');
    ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(pt.month, pt.x, height - padding.bottom + 22);
  });
}

export function renderCategoryBarChart(canvasId, categories = []) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const padding = { top: 20, right: 30, bottom: 20, left: 110 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  const maxCount = Math.max(...categories.map(c => c.productCount || 0), 10) * 1.1;
  const barHeight = Math.min(24, (chartHeight / categories.length) - 10);

  const colors = [chartColor('--primary'), '#1d3557', '#2d6a4f', '#a56319', chartColor('--primary')];

  categories.forEach((cat, index) => {
    const y = padding.top + (chartHeight / categories.length) * index + 6;
    const barW = ((cat.productCount || 0) / maxCount) * chartWidth;

    // Label
    ctx.fillStyle = chartColor('--text-muted');
    ctx.font = '500 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(cat.name, padding.left - 12, y + barHeight / 2 + 4);

    // Bar Background Track
    ctx.fillStyle = chartColor('--bg-surface-elevated');
    ctx.beginPath();
    ctx.roundRect(padding.left, y, chartWidth, barHeight, 6);
    ctx.fill();

    // Active Bar with rounded corners
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.roundRect(padding.left, y, Math.max(8, barW), barHeight, 6);
    ctx.fill();

    // Value label
    ctx.fillStyle = chartColor('--text-main');
    ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${cat.productCount || 0} items`, padding.left + barW + 10, y + barHeight / 2 + 4);
  });
}
