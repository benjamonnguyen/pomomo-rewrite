import cron from 'node-cron';

cron.schedule('* 1 * * *', () => {
  // scan redis store
  // calculate time
    // if < 0, goNextState()
    // else updateTimer()
})

function updateTimer() {

}

function goNextState() {
  
}