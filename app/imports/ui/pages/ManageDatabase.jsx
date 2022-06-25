import React, { useState } from 'react';
import { Card, Container, Header, Loader, Segment, Dropdown, Form, Button, Table, Input, Icon } from 'semantic-ui-react';
import { ZipZap } from 'meteor/udondan:zipzap';
import UploadFixture from '../components/UploadFixture';
import DumpDbFixture from '../components/DumpDbFixture';
import { resetDatabaseMethod, readCSVMethod } from '../../api/base/BaseCollection.methods';
import { PAGE_IDS } from '../utilities/PageIDs';

// const ManageDatabase = ({ ready }) => ((ready) ? (<Container id={PAGE_IDS.MANAGE_DATABASE}>
//   <Header as="h2" textAlign="center">Manage Database</Header>
//   <UploadFixture />
//   <DumpDbFixture />
// </Container>) : <Loader active>Getting data</Loader>);

// ManageDatabase.propTypes = {
//   ready: PropTypes.bool,
// };

// export default withTracker(() => {
//   const ready = AdminProfiles.subscribe().ready() && Stuffs.subscribeStuffAdmin().ready() && UserProfiles.subscribe().ready();
//   return {
//     ready,
//   };
// })(ManageDatabase);

// const dbOptions = [
//   { key: 'drugs', text: 'Drugs', value: 'drugs' },
//   { key: 'vaccines', text: 'Vaccines', value: 'vaccines' },
//   { key: 'supplies', text: 'Supplies', value: 'supplies' },
// ];
const dbs = ["drugs", "vaccines", "supplies"];

const ManageDatabase = () => {
  const [db, setDb] = useState("drugs");
  const [reset, setReset] =  useState(false);

  const onClickReset = () => {
    setReset(true);
    resetDatabaseMethod.callPromise(db)
      .then(response => {
        swal('Success', `${response} ${db} removed successfully.`, 'success', { buttons: false, timer: 3000 });
      })
      .catch(error => {
        swal('Error', error, 'error');
      })
      .finally(() => setReset(false));
  };

  const onClickTemplate = () => {
    readCSVMethod.callPromise(db)
      .then(csv => {
        // console.log(csv)
        const zip = new ZipZap();
        zip.file(`${db}_template.csv`, csv);
        zip.saveAs(`${db}_template.zip`);
      })
      .catch(e => console.log(e));
  };

  return (
    <Container id={PAGE_IDS.MANAGE_DATABASE}>
      <Segment.Group>
        <Segment>
          <Header as="h2">
            {/* <span>{'Manage '}</span>
            <Dropdown inline options={dbOptions} value={db} onChange={(event, { value }) => setDb(value)} />
            <span>{' Database'}</span> */}
            Manage Database
          </Header>
        </Segment>
        <Segment>
          <Table basic='very' unstackable>
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
                    <Table.Cell>
                      <Input type="file" />
                      <span>
                        <Icon name="download" />
                        {`Download ${db}`}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span>
                        <Icon name="upload" />
                        {`Upload ${db}`}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span>
                        <Icon name="trash alternate" />
                        {`Reset ${db}`}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span>
                        <Icon name="download" />
                        {`Download ${db} template`}
                      </span>
                    </Table.Cell>
                  </Table.Row>
                )
              }
            </Table.Body>
          </Table>
          {/* <Card.Group itemsPerRow={2}>
            <Card key='upload'>
              <Card.Content>
                <Card.Description>
                  <UploadFixture db={db} />
                </Card.Description>
              </Card.Content>
            </Card>
            <Card key='download'>
              <Card.Content>
                <Card.Description>
                  <DumpDbFixture db={db} />
                </Card.Description>
              </Card.Content>
            </Card>
            <Card key='reset'>
              <Card.Content>
                <Card.Description>
                  <Form>
                    <Button color="red" loading={reset} onClick={onClickReset} fluid size='massive'>
                      Reset {db}
                    </Button>
                  </Form>
                </Card.Description>
              </Card.Content>
            </Card>
            <Card key='template'>
              <Card.Content>
                <Card.Description>
                  <Form>
                    <Button color="orange" onClick={onClickTemplate} fluid size='massive'>
                      Download {db} template
                    </Button>
                  </Form>
                </Card.Description>
              </Card.Content>
            </Card>
          </Card.Group> */}
        </Segment>
      </Segment.Group>
    </Container>
  );
}

export default ManageDatabase;