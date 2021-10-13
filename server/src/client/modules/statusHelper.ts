export class StatusHelper {

    private table: HTMLElement

    private msgStore: Array<any> = []

    constructor(tableID: string) {
        this.table = document.getElementById(tableID)!
    }

    // Function to name sensor
    private sensorName = (x: string) => {
        return x.replace(/[;]+/g, ' → ')
    }

    // Function to calculate time difference
    private timeDifference = (current: number, previous: number) => {
        let msPerMinute = 60 * 1000;
        let msPerHour = msPerMinute * 60;
        let msPerDay = msPerHour * 24;
        let msPerMonth = msPerDay * 30;
        let msPerYear = msPerDay * 365;

        let elapsed = current - previous;

        if (elapsed < msPerMinute) {
            return '> a minute ago';
        }

        else if (elapsed < msPerHour) {
            return Math.round(elapsed / msPerMinute) + ' minutes ago';
        }

        else if (elapsed < msPerDay) {
            return Math.round(elapsed / msPerHour) + ' hours ago';
        }

        else if (elapsed < msPerMonth) {
            return 'approximately ' + Math.round(elapsed / msPerDay) + ' days ago';
        }

        else if (elapsed < msPerYear) {
            return 'approximately ' + Math.round(elapsed / msPerMonth) + ' months ago';
        }

        else {
            return 'approximately ' + Math.round(elapsed / msPerYear) + ' years ago';
        }
    }

    // Function for updating the table
    updateTable = (sensors?: Array<any>) => {

        // if no sensor is provided, use the store. If one is provided update the store
        if (sensors === undefined) {
            sensors = this.msgStore
        } else {
            this.msgStore = sensors
        }

        let tb = ''
        const time = Date.now()

        for (let row of sensors) {
            if (row.lastMsg) {
                // camera name
                tb = tb.concat('<tr><td>' + this.sensorName(row.door) + '</td>')

                // Last message
                const lastMsgTime = time - row.lastMsg
                if (lastMsgTime < 8.64e7) {
                    tb = tb.concat('<td class = "bg-success text-light">' + this.timeDifference(time, row.lastMsg) + '</td>')
                } else {
                    tb = tb.concat('<td class = "bg-danger text-light">' + this.timeDifference(time, row.lastMsg) + '</td>')
                }
                tb.concat('</tr>')
            }
        }
        this.table.innerHTML = tb
    }
}