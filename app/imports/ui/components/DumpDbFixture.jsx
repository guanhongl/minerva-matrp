import { ZipZap } from 'meteor/udondan:zipzap';
import moment from 'moment';
import React, { useState } from 'react';
import { Button, Form, Grid, Header, Message, Segment } from 'semantic-ui-react';
import { dumpDatabaseMethod } from '../../api/base/BaseCollection.methods';
import AdminDatabaseAccordion from './AdminDatabaseAccordion';

export const databaseFileDateFormat = 'YYYY-MM-DD-HH-mm-ss';

const DumpDbFixture = () => {
  const [error, setError] = useState(false);
  const [results, setResults] = useState([]);
  const [inProgress, setInProgress] = useState(false);

  const onClick = (db) => {
    setInProgress(true);
    dumpDatabaseMethod.callPromise(db)
      .then(result => {
        setResults(result);
        const zip = new ZipZap();
        const dir = 'matrp-db';
        // const fileName = `${dir}/${moment(result.timestamp).format(databaseFileDateFormat)}.json`;
        const fileName = `${dir}/${db}.json`;
        zip.file(fileName, JSON.stringify(result, null, 2));
        zip.saveAs(`${dir}.zip`);
      })
      .catch(() => setError(true))
      .finally(() => setInProgress(false));
  };

  return (
    <Segment>
      <Header dividing>Dump DB Fixture</Header>
      <Form>
        <Button color="green" loading={inProgress} basic type="submit" onClick={() => onClick("drugs")}>
          Dump Database
        </Button>
        {/* {results.length > 0 ? (
          <Grid stackable style={{ paddingTop: 20 }}>
            <Message positive={!error} error={error}>
              {results.map((item, index) => (
                <AdminDatabaseAccordion key={item.name} index={index} name={item.name} contents={item.contents} />
              ))}
            </Message>
          </Grid>
        ) : (
          ''
        )} */}
      </Form>
    </Segment>
  );
};
export default DumpDbFixture;
