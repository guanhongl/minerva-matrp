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

        // flatten
        const json = [];
        result.forEach(obj => {
          // wrap strings in quotes to escape commas
          // use additional quote to escape double quotes
          obj.name = `"${obj.name.replace('"', '""')}"`;
          obj.type = `"${obj.type.join(', ')}"`;
          obj.unit = `"${obj.unit}"`

          const { lotIds, ...inner } =  obj;

          lotIds.forEach(outer => {
            json.push({ 
              ...inner, 
              // custom ordering
              lotId: `"${outer.lotId}"`,
              brand: `"${outer.brand}"`,
              expire: outer.hasOwnProperty('expire') ? `"${outer.expire}"` : "",
              location: `"${outer.location}"`,
              quantity: outer.quantity,
              donated: outer.donated,
              donatedBy: outer.hasOwnProperty('donatedBy') ? `"${outer.donatedBy}"` : "",
              note: outer.hasOwnProperty('note') ? `"${outer.note}"` : "",
              _id: outer._id,
              QRCode: outer.hasOwnProperty('QRCode') ? `"${outer.QRCode}"` : "",
            });
          });
        });

        const csv = json.map(row => Object.values(row));
        csv.unshift(Object.keys(json[0]));
        csv_string = csv.join('\n');

        const zip = new ZipZap();
        const dir = 'matrp-db';
        // const fileName = `${dir}/${moment(result.timestamp).format(databaseFileDateFormat)}.json`;
        const fileName = `${dir}/${db}.csv`;
        // zip.file(fileName, JSON.stringify(json, null, 2));
        zip.file(fileName, csv_string);
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
