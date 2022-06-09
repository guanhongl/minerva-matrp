import { ZipZap } from 'meteor/udondan:zipzap';
import moment from 'moment';
import React, { useState } from 'react';
import { Button, Form, Grid, Header, Message, Segment } from 'semantic-ui-react';
import { dumpDatabaseMethod } from '../../api/base/BaseCollection.methods';
import AdminDatabaseAccordion from './AdminDatabaseAccordion';
import { Parser, transforms } from 'json2csv';

export const databaseFileDateFormat = 'YYYY-MM-DD-HH-mm-ss';

const DumpDbFixture = ({ db }) => {
  const [error, setError] = useState(false);
  const [results, setResults] = useState([]);
  const [inProgress, setInProgress] = useState(false);

  const onClick = () => {
    setInProgress(true);
    dumpDatabaseMethod.callPromise(db)
      .then(result => {
        setResults(result);

        let fields, arr;
        switch (db) {
          case 'drugs':
            fields = ['drug', 'drugType', 'minQuantity', 'unit', 
              'lotIds.lotId', 'lotIds.brand', 'lotIds.expire', 'lotIds.location', 'lotIds.quantity', 
              'lotIds.donated', 'lotIds.donatedBy', 'lotIds.note', 'lotIds._id', 'lotIds.QRCode'];
            arr = 'lotIds';
            break;
          case 'vaccines':
            fields = ['vaccine', 'brand', 'minQuantity', 'visDate', 
              'lotIds.lotId', 'lotIds.expire', 'lotIds.location', 'lotIds.quantity', 'lotIds.note', 'lotIds._id', 'lotIds.QRCode'];
            arr = 'lotIds';
            break;
          case 'supplies':
            fields = ['supply', 'supplyType', 'minQuantity', 
              'stock.location', 'stock.quantity', 'stock.donated', 'stock.donatedBy', 'stock.note', 'stock._id', 'stock.QRCode'];
            arr = 'stock';
            break;
          default:
            console.log('No type.');
        };
        const transforms_ = [transforms.unwind({ paths: [arr] })];
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
    // <Segment>
    //   <Header dividing>Dump DB Fixture</Header>
      <Form>
        <Button color="green" loading={inProgress} basic type="submit" onClick={onClick}>
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
    // </Segment>
  );
};
export default DumpDbFixture;
