import React, { useState } from 'react';
import { Button, Modal, Input, TextArea, Select, Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import swal from 'sweetalert';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import { Vaccines } from '../../../api/vaccine/VaccineCollection';
import { updateMethod } from '../../../api/base/BaseCollection.methods';
import { printQRCode, getOptions } from '../../utilities/Functions';

const VaccineInfoPage = ({ info: { _id, vaccine, brand, minQuantity, visDate }, 
                           detail: { _id: uuid, lotId, expire, location, quantity, note, QRCode },
                           locations }) => {
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(false);

  // form fields
  const initialState = {
    newVaccine: vaccine,
    newBrand: brand,
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

  const submit = (data) => {
    fields.newMinQuantity = parseInt(fields.newMinQuantity, 10);
    fields.newQuantity = parseInt(fields.newQuantity, 10);

    const collectionName = Vaccines.getCollectionName();
    const exists = Vaccines.findOne({ _id });
    const { lotIds } = exists;
    const target = lotIds.find(obj => obj._id === uuid);
    target.lotId = fields.newLotId;
    target.expire = fields.newExpire;
    target.location = fields.newLocation;
    target.quantity = fields.newQuantity;
    target.note = fields.newNote;
    const updateData = { id: _id, vaccine: fields.newVaccine, brand: fields.newBrand, minQuantity: fields.newMinQuantity, visDate: fields.newVisDate, lotIds };
    updateMethod.callPromise({ collectionName, updateData })
      .then(() => swal('Success', 'Vaccine updated successfully', 'success', { buttons: false, timer: 3000 }))
      .catch(error => swal('Error', error.message, 'error'));
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
              <td style={{ width: '150px' }}>General Info</td>
              <td>
                <div>
                  <span className='header'>Vaccine:</span>
                  {
                    edit ?
                      <Input name='newVaccine' value={fields.newVaccine} onChange={handleChange} />
                      :
                      <>{vaccine}</>
                  }
                </div>
                <div>
                  <span className='header'>Brand:</span>
                  {
                    edit ?
                      <Input name='newBrand' value={fields.newBrand} onChange={handleChange} />
                      :
                      <>{brand}</>
                  }
                </div>
                <div>
                  <span className='header'>Minimum Quantity:</span>
                  {
                    edit ?
                      <Input name='newMinQuantity' type='number' min={1}
                        value={fields.newMinQuantity} onChange={handleChange} />
                      :
                      <>{minQuantity}</> 
                  }
                </div>
                <div>
                  <span className='header'>VIS Date:</span>
                  {
                    edit ?
                      <Input name='newVisDate' type='date' value={fields.newVisDate} onChange={handleChange} />
                      :
                      <>{moment(visDate).format('LL')}</>
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
                      <>{lotId}</>
                  }
                </div>
                <div>
                  <span className='header'>Expiration Date:</span>
                  {
                    edit ?
                      <Input name='newExpire' type='date' value={fields.newExpire} onChange={handleChange} />
                      :
                      <>{expire ? moment(expire).format('LL') : 'N/A'}</>
                  }
                </div>
                <div>
                  <span className='header'>Location:</span>
                  {
                    edit ?
                      <Select name='newLocation' options={getOptions(locations)}
                        value={fields.newLocation} onChange={handleChange} />
                      :
                      <>{location}</>
                  }
                </div>
                <div>
                  <span className='header'>Quantity:</span>
                  {
                    edit ?
                      <Input name='newQuantity' type='number' min={1}
                        value={fields.newQuantity} onChange={handleChange} />
                      :
                      <>{quantity}</>
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
          onClick={submit}
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
