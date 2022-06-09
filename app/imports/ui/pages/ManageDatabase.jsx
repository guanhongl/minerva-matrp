import React, { useState } from 'react';
import { Card, Container, Header, Loader, Segment, Dropdown, Form, Button } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { ZipZap } from 'meteor/udondan:zipzap';
import { AdminProfiles } from '../../api/user/AdminProfileCollection';
import { Stuffs } from '../../api/stuff/StuffCollection';
import { UserProfiles } from '../../api/user/UserProfileCollection';
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

const dbOptions = [
  { key: 'drugs', text: 'Drugs', value: 'drugs' },
  { key: 'vaccines', text: 'Vaccines', value: 'vaccines' },
  { key: 'supplies', text: 'Supplies', value: 'supplies' },
];

const ManageDatabase = () => {
  const [db, setDb] = useState("drugs");
  const [reset, setReset] =  useState(false);

  const onClickReset = () => {
    setReset(true);
    resetDatabaseMethod.callPromise(db)
      .then(response => {
        console.log(response)
      })
      .catch((e) => console.log(e))
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
            <span>{'Manage '}</span>
            <Dropdown inline options={dbOptions} value={db} onChange={(event, { value }) => setDb(value)} />
            <span>{' Database'}</span>
          </Header>
        </Segment>
        <Segment>
          <Card.Group itemsPerRow={2}>
            <Card key='upload'>
              <Card.Content>
                {/* <Card.Header>Upload {db}</Card.Header> */}
                <Card.Description>
                  <UploadFixture db={db} />
                </Card.Description>
              </Card.Content>
            </Card>
            <Card key='download'>
              <Card.Content>
                {/* <Card.Header>Download {db}</Card.Header> */}
                <Card.Description>
                  <DumpDbFixture db={db} />
                </Card.Description>
              </Card.Content>
            </Card>
            <Card key='reset'>
              <Card.Content>
                {/* <Card.Header>Reset {db}</Card.Header> */}
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
                {/* <Card.Header>Download {db} template</Card.Header> */}
                <Card.Description>
                  <Form>
                    <Button color="orange" onClick={onClickTemplate} fluid size='massive'>
                      Download {db} template
                    </Button>
                  </Form>
                </Card.Description>
              </Card.Content>
            </Card>
          </Card.Group>
        </Segment>
      </Segment.Group>
    </Container>
  );
}

export default ManageDatabase;