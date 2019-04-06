let client  = mqtt.connect(BROKER)
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
  .on('start', () => onDrag(true))
  .on('drag', () => onDrag(false))
  .on('end', () => onEnd())

svg.call(drag)

let leftservoRect = d3.select('#leftservo')
let rightservoRect = d3.select('#rightservo')

let rectScaler = d3.scaleLinear().domain([0, 1]).range([0, 200])

let lastmillis = new Date().getTime()

let leftservo = 0
let rightservo = 0

let intervalHandle = null

let count = 0

onEnd()

function onDrag (start) {
  if(start) {
    console.log("START")
    intervalHandle = setInterval(onDrag, 100)
  }

  if (d3.event) {
    let accel = accelerationScale(d3.event.y)
    let turn = turningScale(d3.event.x)
  
    // https://electronics.stackexchange.com/questions/19669/algorithm-for-mixing-2-axis-analog-input-to-control-a-differential-motor-drive

    let k = 1

    leftservo = accel + turn
    rightservo = accel - turn

    if (Math.abs(leftservo) > 1) {
          k = 1 / Math.abs(leftservo)
    }

    if (Math.abs(rightservo) > 1) {
          k = 1 / Math.abs(rightservo)
    }

    leftservo *= k
    rightservo *= k

    leftservoRect.attr('transform', leftservo > 0 ? 'rotate(180)' : '')
    leftservoRect.attr('height', rectScaler(Math.abs(leftservo)))

    rightservoRect.attr('transform', rightservo > 0 ? 'rotate(180)' : '')
    rightservoRect.attr('height', rectScaler(Math.abs(rightservo)))
  }

  let currentTime = new Date().getTime()

  if ((currentTime - lastmillis) > 200) {
    let left =  Math.round(leftservo * LEFT_SERVO_RANGE) + LEFT_SERVO_STOP
    let right =  Math.round(rightservo * RIGHT_SERVO_RANGE) + RIGHT_SERVO_STOP

    count++
    console.log(`[${count}] leftservo:${leftservo.toFixed(2)} rightservo:${rightservo.toFixed(2)}`)
    console.log(`[${count}] left:${left} right:${right}`)
    
    client.publish(LEFT_TOPIC, `${left}`)
    client.publish(RIGHT_TOPIC, `${right}`)
    
    lastmillis = currentTime
  }
}

function onEnd() {
  if (intervalHandle){
    clearInterval(intervalHandle)
    intervalHandle = 0
  }
  leftservo = 0
  rightservo = 0
  client.publish(LEFT_TOPIC, `${LEFT_SERVO_STOP}`)
  client.publish(RIGHT_TOPIC, `${RIGHT_SERVO_STOP}`)

  leftservoRect.attr('height', rectScaler(0))
  rightservoRect.attr('height', rectScaler(0))
  console.log("STOP!")
}