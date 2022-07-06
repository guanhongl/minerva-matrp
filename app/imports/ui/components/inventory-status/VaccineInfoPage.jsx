import React, { useState } from 'react';
import { Button, Modal, Input, TextArea, Select, Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { updateMethod } from '../../../api/vaccine/VaccineCollection.methods';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { printQRCode, getOptions } from '../../utilities/Functions';

const submit = (_id, uuid, fields) => {
  updateMethod.callPromise({ _id, uuid, fields })
    .then(success => swal('Success', success, 'success', { buttons: false, timer: 3000 }))
    .catch(error => swal('Error', error.message, 'error'));
};

const VaccineInfoPage = ({ info: { _id, vaccine, brand, minQuantity, visDate }, 
                           detail: { _id: uuid, lotId, expire, location, quantity, note, QRCode },
                           locations }) => {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  // form fields
  const initialState = {
    newMinQuantity: minQuantity,
    newVisDate: visDate,
    newLotId: lotId,
    newExpire: expire,
    newLocation: location,
    newQuantity: quantity,
    newNote: note,
  };

  const [fields, setFields] = useState(initialState);

  const handleEdit = () => {
    setEdit(!edit);
    setFields(initialState);
  }

  const handleChange = (event, { name, value }) => {
    setFields({ ...fields, [name]: value });
  };

  return (
    <Modal
      closeIcon
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Icon name='info' id={COMPONENT_IDS.VACCINE_INFO_BUTTON}/>}
      size='small'
      id={COMPONENT_IDS.VACCINE_INFO}
      className='info-modal'
    >
      <Modal.Header>Vaccine Information</Modal.Header>
      <Modal.Content scrolling>
        <table>
          <tbody>
            <tr>
              <td>General Info</td>
              <td>
                <div>
                  <span className='header'>Vaccine:</span>
                  {
                    edit ?
                      <Input value={vaccine} disabled />
                      :
                      <span>{vaccine}</span>
                  }
                </div>
                <div>
                  <span className='header'>Brand:</span>
                  {
                    edit ?
                      <Input value={brand} disabled />
                      :
                      <span>{brand}</span>
                  }
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {
                    edit ?
                      <Input name='newMinQuantity' type='number' min={1}
                        value={fields.newMinQuantity} onChange={handleChange} />
                      :
                      <span>{minQuantity}</span> 
                  }
                </div>
                <div>
                  <span className='header'>VIS Date:</span>
                  {
                    edit ?
                      <Input name='newVisDate' type='date' value={fields.newVisDate} onChange={handleChange} />
                      :
                      <span>{moment(visDate).format('LL')}</span>
                  }
                </div>
              </td>
            </tr>
            <tr>
              <td>Details</td>
              <td>
                <div>
                  <span className='header'>Lot Number:</span>
                  {
                    edit ?
                      <Input name='newLotId' value={fields.newLotId} onChange={handleChange} />
                      :
                      <span>{lotId}</span>
                  }
                </div>
                <div>
                  <span className='header'>Expiration Date:</span>
                  {
                    edit ?
                      <Input name='newExpire' type='date' value={fields.newExpire} onChange={handleChange} />
                      :
                      <span>{expire ? moment(expire).format('LL') : 'N/A'}</span>
                  }
                </div>
                <div>
                  <span className='header'>Location:</span>
                  {
                    edit ?
                      <Select name='newLocation' options={getOptions(locations)}
                        value={fields.newLocation} onChange={handleChange} />
                      :
                      <span>{location}</span>
                  }
                </div>
                <div>
                  <span className='header'>Quantity:</span>
                  {
                    edit ?
                      <Input name='newQuantity' type='number' min={1}
                        value={fields.newQuantity} onChange={handleChange} />
                      :
                      <span>{quantity}</span>
                  }
                </div>
                {/* <div>
                  <span className='header'>Donated:</span>
                  {donated ? 'Yes' : 'No'}
                </div>
                {
                  donated &&
                  <div>
                    <span className='header'>Donated By:</span>
                    {donatedBy}
                  </div>
                } */}
              </td>
            </tr>
            <tr>
              <td>Note</td>
              <td>
                <TextArea rows={3} name='newNote' value={fields.newNote} onChange={handleChange} />
              </td>
            </tr>
          </tbody>
        </table>
      </Modal.Content>
      <Modal.Actions>
        {
          QRCode &&
          <Button
            circular
            // content="Print QR Code"
            // labelPosition='right'
            icon='qrcode'
            onClick={() => printQRCode(QRCode)}
            color='black'
          />
        }
        <Button
          circular
          icon={edit ? 'ban' : 'pencil'}
          onClick={handleEdit}
          color='linkedin'
        />
        <Button
          circular
          // id={COMPONENT_IDS.VACCINE_EDIT}
          // content="Save Changes"
          // labelPosition='right'
          icon='check'
          onClick={() => submit(_id, uuid, fields)}
          color='green'
        />
        {/* <Button color='black' onClick={() => setOpen(false)} id={COMPONENT_IDS.VACCINE_INFO_CLOSE}>
          Close
        </Button> */}
      </Modal.Actions>
    </Modal>
  );
};

// Require a document to be passed to this component.
VaccineInfoPage.propTypes = {
  info: PropTypes.object.isRequired,
  detail: PropTypes.object.isRequired,
};

export default VaccineInfoPage;
