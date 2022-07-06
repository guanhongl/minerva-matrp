import React from 'react';
import { Button, Modal } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';

const VaccineRecord = ({ open, setOpen, record }) => {

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
      <Modal.Header>Vaccine Historical Record</Modal.Header>
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
              element.map(({ lotId, brand, expire, dose, quantity, visDate, name }, index) => 
                <tr key={lotId}>
                  <td>{`Vaccine ${index+1}`}</td>
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
                      <span className='header'>Dose Number:</span>
                      <span>{dose > 0 ? dose : 'N/A'}</span>
                    </div>
                    <div>
                      <span className='header'>Quantity:</span>
                      <span>{quantity}</span>
                    </div>
                    <div>
                      <span className='header'>VIS Date:</span>
                      <span>{moment(visDate).format('LL')}</span>
                    </div>
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

VaccineRecord.propTypes = {
  record: PropTypes.object.isRequired,
};

export default VaccineRecord;
