import React from 'react';
import { Button, Modal } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';

const SupplyRecord = ({ open, setOpen, record }) => {

  const { dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element } = record;

  return (
    <Modal
      onClose={() => setOpen(false)}
      open={open}
      size='tiny'
      dimmer='blurring'
      id={COMPONENT_IDS.DISPENSE_INFO}
    >
      <Modal.Header>Supply Historical Record</Modal.Header>
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
          element.map(({ supplyType, quantity, donated, donatedBy, name }, index) => 
            <>
              <div>
                <span className='header'>{`Supply ${index+1}:`}</span>
                {name}
              </div>
              <div>
                <span className='header'>Supply Type:</span>
                {supplyType}
              </div>
              <div>
                <span className='header'>Quantity Dispensed:</span>
                {quantity}
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

SupplyRecord.propTypes = {
  record: PropTypes.object.isRequired,
};

export default SupplyRecord;
