const supabaseUrl = 'https://flpcdxxaexyriudizhty.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyNjQyNzkyOCwiZXhwIjoxOTQyMDAzOTI4fQ.XoT5qhcfNYapF_rDJxzokPX9eOGCB0hzBW5crHvcnoA'
const db = supabase.createClient(supabaseUrl, supabaseKey)

let DateTime = luxon.DateTime;

const subscribe = (location, elements) => {
    return db
        .from(`counter:location=eq.${location}`)
        .on('*', payload => {
            initiatePage(location, elements)
        })
        .subscribe()
}

// const handleNewCount = (count, elements) => {
//     console.log(count)

//     // First visitor
//     if (count.direction_in === 1 && )



// }


const initiatePage = (location, elements) => {
    let start = 0
    let stop = 0

    // First visitor
    if (elements['firstVisitor']) {
        firstVisitor(location).then(r => elements['firstVisitor'].innerHTML = r)
    }

    // Current visitors
    if (elements['currentVisitors']) {
        currentVisitors(location).then(r => elements['currentVisitors'].innerHTML = r)
    }

    // Today Visitors
    if (elements['todayVisitors']) {
        start = DateTime.now().startOf('day').toMillis()
        stop = DateTime.now().toMillis()
        countData(location, start, stop).then(r => elements['todayVisitors'].innerHTML = r)
    }

    // Week Visitors
    if (elements['weekVisitors']) {
        start = DateTime.now().startOf('week').toMillis()
        stop = DateTime.now().toMillis()
        countData(location, start, stop).then(r => elements['weekVisitors'].innerHTML = r)
    }

    // month Visitors
    if (elements['monthVisitors']) {
        start = DateTime.now().startOf('month').toMillis()
        stop = DateTime.now().toMillis()
        countData(location, start, stop).then(r => elements['monthVisitors'].innerHTML = r)
    }

    // year Visitors
    if (elements['yearVisitors']) {
        start = DateTime.now().startOf('year').toMillis()
        stop = DateTime.now().toMillis()
        countData(location, start, stop).then(r => elements['yearVisitors'].innerHTML = r)
    }

    // total visitors
    if (elements['totalVisitors']) {
        start = DateTime.now().startOf('year').plus({ year: -1 }).toMillis()
        stop = DateTime.now().toMillis()
        countData(location, start, stop).then(r => elements['totalVisitors'].innerHTML = r)
    }

    // Night Owls
    if (elements['nightOwls']) {
        start = DateTime.now().startOf('year').toMillis()
        stop = DateTime.now().toMillis()
        countNightOwls(location, start, stop).then(r => elements['nightOwls'].innerHTML = r)
    }

    return elements
}



const firstVisitor = async (location) => {
    const { data, error } = await db
        .from('counter')
        .select('*')
        .eq('location', location)
        .eq('direction_in', 1)
        .order('time', { ascending: false })
        .limit(1)
        .single()

    if (error) { return 'No early birds' }
    
    if (DateTime.fromMillis(data.time).toFormat('c') !== DateTime.now().toFormat('c')) {return 'No early birds' } // Return no birds if not the same day

    return DateTime.fromMillis(data.time).toFormat('HH:MM')
}

const currentVisitors = async (location) => {
    let time = 0
    // if it is between 24 and 03
    if (DateTime.now().toFormat('H') > 0 && DateTime.now().toFormat('H') < 3) {
        time = DateTime.now().plus({ days: -1 }).startOf('day').plus({ hour: 3 }).toMillis()
    } else {
        time = DateTime.now().startOf('day').plus({ hour: 3 }).toMillis()
    }

    const { data, error } = await db
        .from('counter')
        .select('*')
        .eq('location', location)
        .order('time', { ascending: true })
        .gt('time', time)

    if (error) { console.log(error) }

    let visitors = 0
    for (const count of data) {
        visitors = visitors + count.direction_in - count.direction_out
        if (visitors < 0) { visitors = 0 }
    }

    return visitors
}

const countData = async (location, start, stop) => {
    const { data, error, count } = await db
        .from('counter')
        .select('*', { count: 'exact', head: true })
        .eq('location', location)
        .eq('direction_in', 1)
        .gt('time', start)
        .lt('time', stop)

    if (error) { console.log(error) }
    return count
}
const countNightOwls = async (location, start, stop) => {
    const { data, error, count } = await db
        .from('counter')
        .select('*', { count: 'exact', head: true })
        .eq('location', location)
        .eq('direction_in', 1)
        .eq('nightowl', true)
        .gt('time', start)
        .lt('time', stop)

    if (error) { console.log(error) }
    return count
}

// const countDataWithTime = async (location, start, stop, time1, time2) => {
//     const { data, error } = await db
//         .from('counter')
//         .select('*')
//         .eq('location', location)
//         .eq('direction_in', 1)
//         .gt('time', start)
//         .lt('time', stop)

//     if (error) { console.log(error) }

//     console.log(data)

//     let counter = 0;
//     for (const count of data) {
//         const time = DateTime.fromMillis(count.time).toFormat('H');

//         if (time < time1 || time > time2) {
//             counter++
//         }
//     }
//     return counter
// }

const getData = async (location, start, stop) => {
    const { data, error } = await db
        .from('counter')
        .select('*')
        .eq('location', location)
        .gt('time', start)
        .lt('time', stop)

    if (error) { console.log(error) }
    return data
}

const getInData = async (location, start, stop) => {
    const { data, error } = await db
        .from('counter')
        .select('*')
        .eq('location', location)
        .eq('direction_in', 1)
        .gt('time', start)
        .lt('time', stop)

    if (error) { console.log(error) }
    return data
}

export { subscribe, initiatePage, getData, getInData }