import React from 'react';
import { Button, Modal, Card, Grid } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';

/** Renders a single row in the List Stuff table. See pages/ListStuff.jsx. */
const DrugRecord = ({ open, setOpen, record }) => {

  const { dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element } = record;

  return (
    <Modal
      onClose={() => setOpen(false)}
      open={open}
      size='tiny'
      dimmer='blurring'
      id={COMPONENT_IDS.DISPENSE_INFO}
    >
      <Modal.Header>Drug Historical Record</Modal.Header>
      <Modal.Content scrolling>
        <div>
          <span className='header'>Dispense Type:</span>
          {dispenseType}
        </div>
        <div>
          <span className='header'>Date:</span>
          {moment(dateDispensed).format('LLLL')}
        </div>
        <div>
          <span className='header'>Dispensed By:</span>
          {dispensedFrom}
        </div>
        <div>
          <span className='header'>Patient Number:</span>
          {dispensedTo}
        </div>
        <div>
          <span className='header'>Site:</span>
          {site}
        </div>
        <hr />
        {
          element.map(({ unit, lotId, brand, expire, quantity, donated, donatedBy, name }, index) => 
            <>
              <div>
                <span className='header'>{`Drug ${index+1}:`}</span>
                {name}
              </div>
              <div>
                <span className='header'>Lot Number:</span>
                {lotId}
              </div>
              <div>
                <span className='header'>Brand:</span>
                {brand}
              </div>
              <div>
                <span className='header'>Expiration Date:</span>
                {moment(expire).format('LL')}
              </div>
              <div>
                <span className='header'>Quantity Dispensed:</span>
                {`${quantity} ${unit}`}
              </div>
              <div>
                <span className='header'>Donated:</span>
                {donated ? 'Yes': 'No'}
              </div>
              {
                donated &&
                <div>
                  <span className='header'>Donated By:</span>
                  {donatedBy}
                </div>
              }
              <hr />
            </>
          )
        }
        <div>
          <div><b>Note:</b></div>
          {note}
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.DISPENSE_INFO_CLOSE}> Close</Button>
      </Modal.Actions>
    </Modal>

  );
};

DrugRecord.propTypes = {
  record: PropTypes.object.isRequired,
};

export default DrugRecord;
