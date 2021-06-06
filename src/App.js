import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill'; 
import { ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line} from 'recharts';

function App() {

  // EDITOR CODE //

  const [WPMLogDB, setWPMLogDB] = useState([]);

  const [doc, setDoc] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  
  const today = new Date();
  const todayISO = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();


  

  const quillRef = useRef(null);

  useEffect(() => {

    if(quillRef.current) {
        const editor = quillRef.current.getEditor();
        const unprivilegedEditor = quillRef.current.makeUnprivilegedEditor(editor);

        setCharCount(unprivilegedEditor.getLength() - 1);
        setWordCount(unprivilegedEditor.getText().split(/[\s\t]+/).filter((item)=>(item && (item !== '\t'))).length);
    }
  }, [doc]);

  const [refresh, setRefresh] = useState(false);

  
    /*
      called every 60 seconds after typing OR on component unmount
      
        req: {
          words: WPM_words,
          date: todayISO,
          startTime: WPM_startTime,
          duration: new Date().getTime() - WPM_startTime
        }
    */

  const [t, setT] = useState(false);
  const [f, setF] = useState(true); // is first load?

  function timeout(delay, data) {
    if(!t) {
      return new Promise( res => setTimeout(() => res(data), delay) );
    } else {
      return new Promise((res, rej) => rej());
    }
  }

  useEffect( () => {
    async function doTimeout() {
      // if(!t) {
      //   console.log('start time: ', new Date().getTime(), ' word count: ', wordCount);
      // }
      setT(true);
      
      await timeout(2000, { startTime: new Date().getTime(), wordCount: wordCount}).then((data) => {
        if(quillRef.current) {
          const editor = quillRef.current.getEditor();
          const unprivilegedEditor = quillRef.current.makeUnprivilegedEditor(editor);
          let twc = unprivilegedEditor.getText().split(/[\s\t]+/).filter((item)=>(item && (item !== '\t'))).length;
          let currentTime = new Date().getTime();

          let logInDB = WPMLogDB;
          logInDB.push({
            words: twc - data.wordCount,
            totalWords: twc,
            date: todayISO,
            startTime: data.startTime,
            duration: currentTime - data.startTime
          });
          setWPMLogDB(logInDB); // .save()
          setRefresh(refresh ? false : true);

          // console.log('end time: ', currentTime, ' word count: ', twc);

        }

        setT(false);
      }).catch((err) => {return;}); 
    }

    // first load is a pass
    if(!f) {
      doTimeout();
    } else {
      setF(false);
    }

  }, [charCount]);



  const [displayLogTable, setDisplayLogTable] = useState([]);

  useEffect(() => {
    let arr = [];

    for (let i = 0; i < WPMLogDB.length; i++) {
      arr.push(
        <tr key={i}>
          <td>{WPMLogDB[i].date}</td>
          <td>{WPMLogDB[i].words}</td>
          <td>{WPMLogDB[i].totalWords}</td>
          <td>{WPMLogDB[i].startTime}</td>
          <td>{WPMLogDB[i].duration}</td>
        </tr>
      )
    }

    setDisplayLogTable(arr);
  }, [refresh]);





  // VISUALIZER CODE //

  const [chartData, setChartData] = useState([]);
  const [showSpaces, setShowSpaces] = useState(false);

  useEffect(() => {

    let formattedData = [];

    for(let i = 0; i < WPMLogDB.length; i++) { 
      let pushData = {
        "name": new Date(WPMLogDB[i].startTime).toLocaleString(),
        "Words Typed": WPMLogDB[i].words,
        "Total Words": WPMLogDB[i].totalWords
      };

      if(!showSpaces) {
        if(WPMLogDB[i].words === 0) {} else {
          formattedData.push(pushData)
        }
      } else {
        formattedData.push(pushData);
      }
    } 

    setChartData(formattedData);

  }, [refresh, showSpaces]); // refresh should explicitly be tied in code w/ log pseudo table data




  return (
    <div className="App">

      <div className='visualizer'>
        <div className='entry-chart'>
          <ComposedChart  width={730} height={250} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend /> 
            <Bar dataKey="Words Typed" fill="#82ca9d" />
            <Line type="monotone" dataKey="Total Words" stroke="#8884d8" />
          </ComposedChart>
        </div>
        <button onClick={e=>setShowSpaces(showSpaces ? false : true)}>
          {showSpaces ? 'Hide Spaces' : 'Show Spaces'}
        </button>
      </div>

      <div className='editor'>

        Words:&nbsp;
        {wordCount}
        <br /> 
        Characters:&nbsp;
        {charCount}
        <br /> 
        <br /> 

        <ReactQuill
          ref={quillRef}
          formats={['bold', 'italic', 'underline']}
          value={doc}
          theme={null}
          onChange={setDoc} />
        
        <div className='log-table'>
          <table>
            <tr>
              <td>date</td>
              <td>words</td>
              <td>total words</td>
              <td>startTime</td>
              <td>duration</td>
            </tr>
            {displayLogTable}
          </table>
        </div>
      </div>
    
    </div>
  );
}

export default App;
