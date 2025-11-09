'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Chart.jsのコンポーネントを登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface RatingHistory {
  match_number: number
  rating: number
  date: string
}

interface RatingGraphProps {
  history: RatingHistory[]
  currentRating: number
}

export default function RatingGraph({ history, currentRating }: RatingGraphProps) {
  // データがない場合は初期値のみ表示
  const dataPoints = history.length > 0 ? history : [
    { match_number: 0, rating: currentRating, date: new Date().toISOString() }
  ]

  const data = {
    labels: dataPoints.map((h, index) => 
      index === 0 ? '開始' : `${h.match_number}戦目`
    ),
    datasets: [
      {
        label: 'レーティング',
        data: dataPoints.map(h => h.rating),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: function(context: any) {
            return `レーティング: ${context.parsed.y}`
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        min: Math.max(1000, Math.min(...dataPoints.map(h => h.rating)) - 100),
        max: Math.max(...dataPoints.map(h => h.rating)) + 100,
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
          },
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)',
        },
      },
      x: {
        ticks: {
          color: '#94a3b8',
          font: {
            size: 12,
          },
          maxRotation: 45,
          minRotation: 0,
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6">
      <h3 className="text-white text-lg font-bold mb-4">レーティンググラフ</h3>
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
      {history.length === 0 && (
        <p className="text-slate-400 text-sm text-center mt-4">
          対戦を行うとレーティングの推移が表示されます
        </p>
      )}
    </div>
  )
}
