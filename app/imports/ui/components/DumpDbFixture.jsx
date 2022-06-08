import { ZipZap } from 'meteor/udondan:zipzap';
import moment from 'moment';
import React, { useState } from 'react';
import { Button, Form, Grid, Header, Message, Segment } from 'semantic-ui-react';
import { dumpDatabaseMethod } from '../../api/base/BaseCollection.methods';
import AdminDatabaseAccordion from './AdminDatabaseAccordion';
import { Parser, transforms } from 'json2csv';

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

        const fields = ['name', 'type', 'minimum', 'unit', 
          'lotIds.lotId', 'lotIds.brand', 'lotIds.expire', 'lotIds.location', 'lotIds.quantity', 'lotIds.donated', 'lotIds.donatedBy', 'lotIds.note', 'lotIds._id', 'lotIds.QRCode'];
        const transforms_ = [transforms.unwind({ paths: ['lotIds'] })];
        const json2csvParser = new Parser({ fields, transforms: transforms_ });
        const csv = json2csvParser.parse(result);

        const zip = new ZipZap();
        const dir = 'matrp-db';
        // const fileName = `${dir}/${moment(result.timestamp).format(databaseFileDateFormat)}.json`;
        const fileName = `${dir}/${db}.csv`;
        // zip.file(fileName, JSON.stringify(json, null, 2));
        zip.file(fileName, csv);
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
