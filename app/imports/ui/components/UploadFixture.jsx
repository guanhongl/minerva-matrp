import React, { useState } from 'react';
import { Form, Header, Segment } from 'semantic-ui-react';
import { loadFixtureMethod } from '../../api/base/BaseCollection.methods';
import UploadFixtureResult from './UploadFixtureResult';
import csv from 'csvtojson';

const UploadFixture = ({ db }) => {
  const [fileDataState, setFileData] = useState('');
  const [uploadResult, setUploadResult] = useState('');
  const [error, setError] = useState(false);
  const [uploadFixtureWorking, setUploadFixtureWorking] = useState(false);

  const readFile = (e) => {
    const files = e.target.files;
    // eslint-disable-next-line no-undef
    const reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = (event) => {
      if (files[0].type === 'text/csv') {
        setFileData(event.target.result);
      } else {
        setFileData('');
        setError(true);
        setUploadResult('Invalid file format. Only files with the extension csv are allowed');
        swal('Error', 'Invalid file format. Only files with the extension csv are allowed', 'error');
      }
    };
  };

  const onSubmit = () => {
    // const jsonData = fileDataState ? JSON.parse(fileDataState) : false;
    // if (jsonData) {
    //   setUploadFixtureWorking(true);
    //   loadFixtureMethod.callPromise(jsonData)
    //     .then(result => { setUploadResult(result); })
    //     .catch(err => { setError(true); setUploadResult(err.message); })
    //     .finally(() => { console.log('finally'); setUploadFixtureWorking(false); });
    // } else {
    //   setError(true);
    //   setUploadResult('No file specified');
    // }

    if (fileDataState) {
      setUploadFixtureWorking(true);

      csv({ checkType: true }).fromString(fileDataState)
        .then((fixtureData) => {
          console.log(fixtureData)
          return loadFixtureMethod.callPromise({ fixtureData, db });
        })
        .then(result => { 
          setUploadResult(result); 
          swal('Success', `${result} ${db} defined successfully.`, 'success', { buttons: false, timer: 3000 });
        })
        .catch(err => { 
          setError(true); 
          setUploadResult(err.message); 
          swal('Error', err.message, 'error');
        })
        .finally(() => { setUploadFixtureWorking(false); });
    } else {
      setError(true);
      setUploadResult('No file specified');
      swal('Error', 'No file specified', 'error');
    }
  };

  return (
    // <Segment>
    //   <Header dividing>Upload DB Fixture</Header>
      <Form widths="equal" onSubmit={onSubmit}>
        <Form.Field>
          <Form.Input type="file" onChange={readFile} />
          <Form.Button color="green" loading={uploadFixtureWorking} type="Submit" fluid size='massive'>
            Upload {db}
          </Form.Button>
        </Form.Field>
      </Form>
      // {uploadResult ? <UploadFixtureResult error={error} message={uploadResult} /> : ''}
    // </Segment>
  );
};

export default UploadFixture;
