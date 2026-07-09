const CATEGORY_COLORS = {
  food: '#f43f5e',       // 食費: Rose
  shopping: '#eab308',   // 日用品・買い物: Yellow
  entertainment: '#a855f7', // 交際費: Purple
  transport: '#10b981',  // 交通費: Emerald
  utilities: '#3b82f6',  // 住居・光熱費: Blue
  other: '#6b7280'       // その他: Gray
};

const CATEGORY_LABELS = {
  food: '食費',
  shopping: '日用品・買い物',
  entertainment: '交際費',
  transport: '交通費',
  utilities: '住居・光熱費',
  other: 'その他'
};

function Charts({ transactions, currentYear, currentMonth }) {
  // --- 1. Category Chart Data ---
  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

  // Group by category
  const categoryData = {};
  Object.keys(CATEGORY_LABELS).forEach(cat => {
    categoryData[cat] = 0;
  });

  expenses.forEach(t => {
    const cat = t.category || 'other';
    if (categoryData[cat] !== undefined) {
      categoryData[cat] += Number(t.amount);
    } else {
      categoryData['other'] = (categoryData['other'] || 0) + Number(t.amount);
    }
  });

  // Convert to array and filter out 0 values
  const sortedCategories = Object.keys(categoryData)
    .map(key => ({
      key,
      label: CATEGORY_LABELS[key],
      amount: categoryData[key],
      color: CATEGORY_COLORS[key] || CATEGORY_COLORS.other,
      percentage: totalExpense > 0 ? (categoryData[key] / totalExpense) * 100 : 0
    }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // --- 2. Daily Area Chart Data ---
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const dailyAmounts = Array(daysInMonth).fill(0);

  expenses.forEach(t => {
    if (!t.date) return;
    // Firestore Timestamp or JS Date
    const transactionDate = t.date.seconds ? new Date(t.date.seconds * 1000) : new Date(t.date);
    if (
      transactionDate.getFullYear() === currentYear &&
      (transactionDate.getMonth() + 1) === currentMonth
    ) {
      const day = transactionDate.getDate();
      if (day >= 1 && day <= daysInMonth) {
        dailyAmounts[day - 1] += Number(t.amount);
      }
    }
  });

  // Graph Dimensions
  const graphWidth = 500;
  const graphHeight = 180;
  const padding = { top: 15, right: 15, bottom: 25, left: 45 };
  const plotWidth = graphWidth - padding.left - padding.right;
  const plotHeight = graphHeight - padding.top - padding.bottom;

  // Max value for Y scaling
  const maxDailyAmount = Math.max(...dailyAmounts);
  const yMax = maxDailyAmount > 0 ? Math.ceil(maxDailyAmount / 1000) * 1000 : 5000;

  // Build points for area chart
  const points = dailyAmounts.map((amount, index) => {
    const x = padding.left + (index / (daysInMonth - 1)) * plotWidth;
    const y = padding.top + plotHeight - (amount / yMax) * plotHeight;
    return { x, y, amount, day: index + 1 };
  });

  // Path generator for line
  const linePath = points.length > 0
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : '';

  // Path generator for gradient area (close the shape to bottom of plot)
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${padding.top + plotHeight} L ${points[0].x} ${padding.top + plotHeight} Z`
    : '';

  // Donut chart stroke math
  // Radius = 36, Circumference = 2 * PI * 36 ≈ 226.19
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  
  // Pre-calculate rotation offsets outside render output loop to satisfy immutability rules
  const categoriesWithAngles = sortedCategories.map((cat, index) => {
    const strokeDashoffset = circumference - (cat.percentage / 100) * circumference;
    
    // Calculate cumulative percentage of previous categories to determine the starting angle
    const prevPercentSum = sortedCategories
      .slice(0, index)
      .reduce((sum, c) => sum + c.percentage, 0);
      
    const rotation = (prevPercentSum / 100) * 360 - 90;
    
    return {
      ...cat,
      strokeDashoffset,
      rotation
    };
  });

  return (
    <div style={styles.container}>
      {/* Category Donut Chart Card */}
      <div className="glass-panel" style={styles.card}>
        <h3 style={styles.cardTitle}>カテゴリ別支出</h3>
        {totalExpense === 0 ? (
          <div style={styles.emptyState}>
            <span>📊</span>
            <p>今月の支出データはありません</p>
          </div>
        ) : (
          <div style={styles.donutContainer}>
            <div style={styles.svgWrapper}>
              <svg width="150" height="150" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="10"
                />
                {/* Segments */}
                {categoriesWithAngles.map(cat => {
                  return (
                    <circle
                      key={cat.key}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={cat.strokeDashoffset}
                      transform={`rotate(${cat.rotation} 50 50)`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  );
                })}
                {/* Centered Text */}
                <text
                  x="50"
                  y="47"
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="7"
                  fontWeight="500"
                >
                  総支出
                </text>
                <text
                  x="50"
                  y="58"
                  textAnchor="middle"
                  fill="var(--text-main)"
                  fontSize="9.5"
                  fontWeight="700"
                >
                  ¥{totalExpense.toLocaleString()}
                </text>
              </svg>
            </div>
            
            <div style={styles.legend}>
              {sortedCategories.map(cat => (
                <div key={cat.key} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: cat.color }} />
                  <span style={styles.legendLabel}>{cat.label}</span>
                  <span style={styles.legendAmount}>{cat.amount.toLocaleString()}円</span>
                  <span style={styles.legendPercent}>({cat.percentage.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Daily Trend Area Chart Card */}
      <div className="glass-panel" style={styles.card}>
        <h3 style={styles.cardTitle}>日別支出推移</h3>
        <div style={styles.chartWrapper}>
          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} width="100%" height="100%">
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-expense)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--color-expense)" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + ratio * plotHeight;
              const val = Math.round(yMax * (1 - ratio));
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={graphWidth - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--text-muted)"
                    fontSize="10"
                  >
                    ¥{val.toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* X-axis labels (days 1, 10, 20, end) */}
            {[1, 10, 20, daysInMonth].map((day, i) => {
              const x = padding.left + ((day - 1) / (daysInMonth - 1)) * plotWidth;
              return (
                <text
                  key={i}
                  x={x}
                  y={graphHeight - 8}
                  textAnchor="middle"
                  fill="var(--text-muted)"
                  fontSize="10"
                >
                  {day}日
                </text>
              );
            })}

            {/* Area Path */}
            {totalExpense > 0 && points.length > 0 && (
              <>
                <path d={areaPath} fill="url(#area-grad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--color-expense)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Data point indicators for non-zero days */}
                {points.map((p, i) => {
                  if (p.amount === 0) return null;
                  return (
                    <g key={i}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="3.5"
                        fill="var(--bg-main)"
                        stroke="var(--color-expense)"
                        strokeWidth="2"
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* Empty trend state */}
            {totalExpense === 0 && (
              <text
                x={graphWidth / 2 + 10}
                y={graphHeight / 2}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize="12"
              >
                支出データがありません
              </text>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.3fr',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  card: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '230px',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: 'var(--text-main)',
    marginBottom: '1rem',
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    gap: '0.5rem',
    fontSize: '0.9rem',
  },
  donutContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flex: 1,
    gap: '1rem',
  },
  svgWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    maxHeight: '130px',
    overflowY: 'auto',
    paddingRight: '0.25rem',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.8rem',
    gap: '0.4rem',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendLabel: {
    color: 'var(--text-muted)',
    width: '70px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  legendAmount: {
    color: 'var(--text-main)',
    fontWeight: '600',
    marginLeft: 'auto',
  },
  legendPercent: {
    color: 'var(--text-muted)',
    fontSize: '0.7rem',
    width: '32px',
    textAlign: 'right',
  },
  chartWrapper: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Responsive overrides in CSS, but handle layouts gracefully
};

// Add responsive container override detection if necessary, but CSS handles layout.
// For mobile, we will force grid-template-columns: 1fr via CSS if needed.
export default Charts;
