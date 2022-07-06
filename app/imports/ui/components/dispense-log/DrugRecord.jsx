import React from 'react';
import { Button, Modal } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';

const DrugRecord = ({ open, setOpen, record }) => {

  const { dispenseType, dateDispensed, dispensedFrom, dispensedTo, site, note, element } = record;

  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      open={open}
      size='small'
      dimmer='blurring'
      id={COMPONENT_IDS.DISPENSE_INFO}
    >
      <Modal.Header>Drug Historical Record</Modal.Header>
      <Modal.Content scrolling>
        <table>
          <tbody>
            <tr>
              <td>General Info</td>
              <td>
                <div>
                  <span className='header'>Dispense Type:</span>
                  <span>{dispenseType}</span>
                </div>
                <div>
                  <span className='header'>Date:</span>
                  <span>{moment(dateDispensed).format('LLLL')}</span>
                </div>
                <div>
                  <span className='header'>Dispensed By:</span>
                  <span>{dispensedFrom}</span>
                </div>
                <div>
                  <span className='header'>Patient Number:</span>
                  <span>{dispensedTo}</span>
                </div>
                <div>
                  <span className='header'>Site:</span>
                  <span>{site}</span>
                </div>
              </td>
            </tr>
            {
              element.map(({ unit, lotId, brand, expire, quantity, donated, donatedBy, name }, index) => 
                <tr key={lotId}>
                  <td>{`Drug ${index+1}`}</td>
                  <td>
                    <div>
                      <span className='header'>Name:</span>
                      <span>{name}</span>
                    </div>
                    <div>
                      <span className='header'>Lot Number:</span>
                      <span>{lotId}</span>
                    </div>
                    <div>
                      <span className='header'>Brand:</span>
                      <span>{brand}</span>
                    </div>
                    <div>
                      <span className='header'>Expiration Date:</span>
                      <span>{expire ? moment(expire).format('LL') : "N/A"}</span>
                    </div>
                    <div>
                      <span className='header'>Quantity Dispensed:</span>
                      <span>{`${quantity} ${unit}`}</span>
                    </div>
                    <div>
                      <span className='header'>Donated:</span>
                      <span>{donated ? 'Yes': 'No'}</span>
                    </div>
                    {
                      donated &&
                      <div>
                        <span className='header'>Donated By:</span>
                        <span>{donatedBy}</span>
                      </div>
                    }
                  </td>
                </tr>
              )
            }
            <tr>
              <td>Note</td>
              <td><textarea rows='3' readOnly value={note} /></td>
            </tr>
          </tbody>
        </table>
      </Modal.Content>
      {/* <Modal.Actions>
        <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.DISPENSE_INFO_CLOSE}> Close</Button>
      </Modal.Actions> */}
    </Modal>

  );
};

DrugRecord.propTypes = {
  record: PropTypes.object.isRequired,
};

export default DrugRecord;
