import React, { useEffect, useRef } from 'react'
import Chartist from 'chartist'
import 'chartist/dist/scss/chartist.scss'

const Chart = () => {
  const chartEl = useRef()

  useEffect(() => {
    const chart = new Chartist.Line(
      chartEl.current,
      {
        series: [
          [
            { x: 0, y: 0 },
            { x: 1, y: 100 },
            { x: 2, y: 70 },
            { x: 4, y: 110 },
            { x: 8, y: 90 },
            { x: 10, y: 120 },
            { x: 12, y: 120 },
            { x: 14, y: 130 },
            { x: 16, y: 135 },
            { x: 18, y: 135 },
            { x: 20, y: 140 }
          ]
        ]
      },
      {
        height: '180px',
        axisY: {
          showGrid: false,
          showLabel: false,
          offset: 0,
          scaleMinSpace: 0
        },
        axisX: {
          showGrid: false,
          showLabel: false,
          offset: 0,
          type: Chartist.AutoScaleAxis
        },
        chartPadding: { top: 0, left: 0, right: 0, bottom: 0 },
        fullWidth: true,
        showPoint: false
      }
    )
    chart.on('created', function (ctx) {
      const defs = ctx.svg.elem('defs')
      defs
        .elem('linearGradient', { id: 'gradient', x1: 0, y1: 1, x2: 0, y2: 0 })
        .elem('stop', { offset: 0, 'stop-color': '#f545ff' })
        .parent()
        .elem('stop', { offset: 1, 'stop-color': '#54ff96' })
    })
  }, [])

  return (
    <>
      <div ref={chartEl} />
      <div className="grid grid-flow-col text-center text-sm mt-4 text-gray-300">
        <div>1H</div>
        <div className="font-bold text-white">1D</div>
        <div>1W</div>
        <div>1M</div>
        <div>1Y</div>
        <div>All</div>
      </div>
    </>
  )
}

export default Chart
