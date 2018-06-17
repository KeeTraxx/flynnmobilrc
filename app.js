let client  = mqtt.connect('ws://broker.mqttdashboard.com:8000/mqtt')
client.publish('ch/compile/flynnmobil/test', 'hello')
let svg = d3.select('#svg')

let width;
let height;
let accelerationScale = d3.scaleLinear().range([-1, 1])
let turningScale = d3.scaleLinear().range([-1, 1])

function updateSizes () {
  let rect = svg.node().getBoundingClientRect()
  width = rect.width
  height = rect.height
  accelerationScale.domain([height, 0])
  turningScale.domain([0, width])
}

d3.select(window).on("resize", updateSizes)
updateSizes()

let drag = d3.drag()
  .on('start', () => onDrag())
  .on('drag', () => onDrag())
  .on('end', () => onEnd())

svg.call(drag)

let leftservoRect = d3.select('#leftservo')
let rightservoRect = d3.select('#rightservo')

let rectScaler = d3.scaleLinear().domain([0, 1]).range([0, 200])

let lastmillis = new Date().getTime()

function onDrag () {
  let accel = accelerationScale(d3.event.y)
  let turn = turningScale(d3.event.x)

  // https://electronics.stackexchange.com/questions/19669/algorithm-for-mixing-2-axis-analog-input-to-control-a-differential-motor-drive

  let k = 1

  let leftservo = accel + turn
  let rightservo = accel - turn

  if (Math.abs(leftservo) > 1) {
    k = 1 / Math.abs(leftservo)
  }

  if (Math.abs(rightservo) > 1) {
    k = 1 / Math.abs(rightservo)
  }

  leftservo *= k
  rightservo *= k

  console.log(leftservo, rightservo)

  leftservoRect.attr('transform', leftservo > 0 ? 'rotate(180)' : '')
  leftservoRect.attr('height', rectScaler(Math.abs(leftservo)))

  rightservoRect.attr('transform', rightservo > 0 ? 'rotate(180)' : '')
  rightservoRect.attr('height', rectScaler(Math.abs(rightservo)))

  let currentTime = new Date().getTime()

  if (currentTime - lastmillis > 100) {
    client.publish('ch/compile/flynnmobil/leftservo', '' + Math.round(leftservo * 127));
    client.publish('ch/compile/flynnmobil/rightservo', '' + Math.round(-rightservo * 127));
  }

  lastmillis = currentTime
}

function onEnd() {
  client.publish('ch/compile/flynnmobil/leftservo', '0')
  client.publish('ch/compile/flynnmobil/rightservo', '0')

  leftservoRect.attr('height', rectScaler(0))
  rightservoRect.attr('height', rectScaler(0))
}