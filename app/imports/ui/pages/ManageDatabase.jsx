import React, { useState } from 'react';
import { Container, Header, Loader, Segment, Table, Input, Icon } from 'semantic-ui-react';
import { ZipZap } from 'meteor/udondan:zipzap';
import { uploadDatabaseMethod, downloadDatabaseMethod, resetDatabaseMethod, readCSVMethod } from '../../api/ManageDatabase.methods';
import { PAGE_IDS } from '../utilities/PageIDs';
import moment from 'moment';

const dbs = ["drugs", "vaccines", "supplies"];

const UploadDB = ({ db }) => {
  const [loading, setLoading] = useState(false);
  const [fileDataState, setFileData] = useState('');
  
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
        swal('Error', 'Invalid file format. Only files with the extension csv are allowed', 'error');
      }
    };
  };

  const upload = () => {
    setLoading(true);
    uploadDatabaseMethod.callPromise({ data: fileDataState, db })
      .then(count => swal('Success', `${count} ${db} defined successfully.`, 'success', { buttons: false, timer: 3000 }))
      .catch(error => swal("Error", error.message, "error"))
      .finally(() => setLoading(false));
  };

  return (
    <Table.Cell>
      <div className='flex-div'>
        <Input type="file" onChange={readFile} />
        {
          loading ?
            <Loader inline active />
            :
            <span onClick={upload}>
              <Icon name="upload" />
              {`Upload ${db}`}
              <Icon name="file excel" />
            </span>
        }
      </div>
    </Table.Cell>
  );
};

const DownloadDB = ({ db }) => {
  const [loading, setLoading] = useState(false);

  const download = () => {
    setLoading(true);
    downloadDatabaseMethod.callPromise({ db })
      .then(csv => {
        const zip = new ZipZap();
        const dir = 'minerva-db';
        const fileName = `${dir}/${moment().format("YYYY-MM-DD")}-${db}.csv`;
        zip.file(fileName, csv);
        zip.saveAs(`${dir}.zip`);
      })
      .catch(error => swal("Error", error.message, "error"))
      .finally(() => setLoading(false));
  };

  return (
    <Table.Cell>
      {
        loading ? 
          <Loader inline active />
          :
          <span onClick={download}>
            <Icon name="download" />
            {`Download ${db}`}
            <Icon name="file excel" />
          </span>
      }
    </Table.Cell>
  );
};

const ResetDB = ({ db }) => {
  const [loading, setLoading] = useState(false);

  const reset = () => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to reset ${db}?`,
      icon: 'warning',
      buttons: [
        'No, cancel it!',
        'Yes, I am sure!',
      ],
      dangerMode: true,
    })
      .then((isConfirm) => {
        // if 'yes'
        if (isConfirm) {
          setLoading(true);
          resetDatabaseMethod.callPromise({ db })
            .then(response => {
              swal('Success', `${response} ${db} removed successfully.`, 'success', { buttons: false, timer: 3000 });
            })
            .catch(error => swal('Error', error.message, 'error'))
            .finally(() => setLoading(false));
        }
      });
  };

  return (
    <Table.Cell>
      {
        loading ?
          <Loader inline active />
          :
          <span onClick={reset}>
            <Icon name="trash alternate" />
            {`Reset ${db}`}
          </span>
      }
    </Table.Cell>
  );
};

const DownloadTemplate = ({ db }) => {
  const download = () => {
    readCSVMethod.callPromise({ db })
      .then(csv => {
        // console.log(csv)
        const zip = new ZipZap();
        zip.file(`${db}_template.csv`, csv);
        zip.saveAs(`${db}_template.zip`);
      })
      .catch(error => swal("Error", error.message, "error"));
  };

  return (
    <Table.Cell>
      <span onClick={download}>
        <Icon name="download" />
        {`Download ${db} template`}
        <Icon name="file excel" />
      </span>
    </Table.Cell>
  );
};

const ManageDatabase = () => {
  return (
    <Container id={PAGE_IDS.MANAGE_DATABASE}>
      <Segment.Group>
        <Segment>
          <Header as="h2">
            Manage Database
          </Header>
        </Segment>
        <Segment>
          <Table basic='very' stackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Upload</Table.HeaderCell>
                <Table.HeaderCell>Download</Table.HeaderCell>
                <Table.HeaderCell>Reset</Table.HeaderCell>
                <Table.HeaderCell>Template</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                dbs.map(db => 
                  <Table.Row key={db}>
                    <UploadDB db={db} />
                    <DownloadDB db={db} />
                    <ResetDB db={db} />
                    <DownloadTemplate db={db} />
                  </Table.Row>
                )
              }
              <Table.Row key={"history"}>
                <td />
                <td />
                <ResetDB db={"history"} />
                <td />
              </Table.Row>
            </Table.Body>
          </Table>
        </Segment>
      </Segment.Group>
    </Container>
  );
}

export default ManageDatabase;