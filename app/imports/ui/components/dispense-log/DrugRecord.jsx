import React from 'react';
import { Button, Modal, Card, Grid } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';

/** Renders a single row in the List Stuff table. See pages/ListStuff.jsx. */
const DrugRecord = ({ open, setOpen, drugs, note }) => {
  return (
    <Modal
      onClose={() => setOpen(false)}
      open={open}
      size='small'
      dimmer='blurring'
      id={COMPONENT_IDS.DISPENSE_INFO}
    >
      <Modal.Header>Drug Historical Record</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <Card.Group>
            {
              drugs.map(drug => 
                <Card key={drug.lotId} fluid>
                  <Card.Content>
                    <Card.Header>{drug.name}</Card.Header>
                    <Card.Description>
                      {/* TODO: better HTML */}
                      <Grid divided='vertically'>
                        <Grid.Row columns={2}>
                          <Grid.Column>
                            Lot Number: {drug.lotId}
                          </Grid.Column>
                          <Grid.Column>
                            Brand: {drug.brand}
                          </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={2}>
                          <Grid.Column>
                            Expiration Date: {moment(drug.expire).format('LL')}
                          </Grid.Column>
                          <Grid.Column>
                            Quantity Dispensed: {drug.quantity} {drug.unit}
                          </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={2}>
                          <Grid.Column>
                            Donated: {drug.donated ? 'Yes' : 'No'}
                          </Grid.Column>
                          <Grid.Column>
                            Donated By: {drug.donatedBy}
                          </Grid.Column>
                        </Grid.Row>
                      </Grid>
                    </Card.Description>
                  </Card.Content>
                </Card>
              )
            }
          </Card.Group>
          <Card fluid>
            <Card.Content>
              <Card.Header>Note:</Card.Header>
              <Card.Description>{note}</Card.Description>
            </Card.Content>
          </Card>
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.DISPENSE_INFO_CLOSE}> Close</Button>
      </Modal.Actions>
    </Modal>

  );

};

DrugRecord.propTypes = {
  drugs: PropTypes.array.isRequired,
};

export default DrugRecord;
