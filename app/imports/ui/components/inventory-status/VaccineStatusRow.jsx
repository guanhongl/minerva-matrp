import React, { useState } from 'react';
import { Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import VaccineInfoPage from './VaccineInfoPage';
import { Vaccinations } from '../../../api/vaccination/VaccinationCollection';
import { removeItMethod, updateMethod } from '../../../api/base/BaseCollection.methods';

const VaccineStatusRow = ({ vaccine, locations }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(!isOpen);

  const currentDate = moment();
  const isExpired = vaccine.lotIds.map(({ expire }) => {
    if (expire) {
      return currentDate > moment(expire);
    }
    return false;
  });

  const totalQuantity = vaccine.lotIds.length ?
    _.pluck(vaccine.lotIds, 'quantity')
      .reduce((prev, current, index) => (isExpired[index] ? prev : prev + current), 0)
    : 0;
  const status = Math.floor((totalQuantity / vaccine.minQuantity) * 100);
  const getColor = () => {
    let color;
    if (totalQuantity >= vaccine.minQuantity) { // range [min, inf)
      color = 'green';
    } else if (totalQuantity > 0 && totalQuantity < vaccine.minQuantity) { // range (0, min]
      color = 'yellow';
    } else { // range (0)
      color = 'red';
    }
    return color;
  };

  const deleteVaccine = () => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to delete ${vaccine.vaccine}?`,
      icon: 'warning',
      buttons: [
        'No, cancel it!',
        'Yes, I am sure!',
      ],
      dangerMode: true,
    })
      .then((isConfirm) => {
        // if 'yes'
        if (isConfirm) {
          const collectionName = Vaccinations.getCollectionName();
          removeItMethod.callPromise({ collectionName, instance: vaccine._id })
            .then(() => swal('Success', `${vaccine.vaccine} deleted successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  const deleteLot = (uuid, lotId) => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to delete ${lotId}?`,
      icon: 'warning',
      buttons: [
        'No, cancel it!',
        'Yes, I am sure!',
      ],
      dangerMode: true,
    })
      .then((isConfirm) => {
        // if 'yes'
        if (isConfirm) {
          const collectionName = Vaccinations.getCollectionName();
          const exists = Vaccinations.findOne({ _id: vaccine._id });
          const { lotIds } = exists;
          const targetIndex = lotIds.findIndex((obj => obj._id === uuid));
          lotIds.splice(targetIndex, 1);
          const updateData = { id: vaccine._id, lotIds };
          updateMethod.callPromise({ collectionName, updateData })
            .then(() => swal('Success', `${vaccine.vaccine} updated successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  return (
    <>
      {/* the vaccine, brand row */}
      <Table.Row negative={isExpired.includes(true)} id={COMPONENT_IDS.VACCINE_STATUS_ROW}>
        <Table.Cell className='caret' onClick={handleOpen}>
          <Icon name={`caret ${isOpen ? 'down' : 'up'}`} />
        </Table.Cell>
        <Table.Cell>{vaccine.vaccine}</Table.Cell>
        <Table.Cell>{vaccine.brand}</Table.Cell>
        <Table.Cell>{totalQuantity}</Table.Cell>
        <Table.Cell>{vaccine.visDate}</Table.Cell>
        <Table.Cell>
          <>
            <Icon color={getColor()} name='circle' />
            <span>{status}%</span>
          </>
        </Table.Cell>
        <Table.Cell>
          <Icon name='trash alternate' onClick={deleteVaccine} />
        </Table.Cell>
      </Table.Row>

      {/* the lotId row */}
      <Table.Row style={{ display: isOpen ? 'table-row' : 'none' }}>
        <Table.Cell colSpan={7} className='lot-row'>
          <Table color='blue' unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Lot Number</Table.HeaderCell>
                <Table.HeaderCell>Expiration</Table.HeaderCell>
                <Table.HeaderCell>Location</Table.HeaderCell>
                <Table.HeaderCell>Quantity</Table.HeaderCell>
                <Table.HeaderCell/>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                vaccine.lotIds.map(({ _id: uuid, lotId, expire, location, quantity }, index) => (
                  <Table.Row key={lotId} negative={isExpired[index]}>
                    <Table.Cell>{lotId}</Table.Cell>
                    <Table.Cell>{expire}</Table.Cell>
                    <Table.Cell>{location}</Table.Cell>
                    <Table.Cell>{quantity}</Table.Cell>
                    <Table.Cell className='icons'>
                      <VaccineInfoPage info={vaccine} detail={vaccine.lotIds[index]} locations={locations} />
                      <Icon name='trash alternate' onClick={() => deleteLot(uuid, lotId)} />
                    </Table.Cell>
                  </Table.Row>
                ))
              }
            </Table.Body>
          </Table>
        </Table.Cell>
      </Table.Row>
    </>
  );
};

VaccineStatusRow.propTypes = {
  vaccine: PropTypes.shape({
    vaccine: PropTypes.string,
    brand: PropTypes.string,
    visDate: PropTypes.string,
    lotIds: PropTypes.array,
    minQuantity: PropTypes.number,
    _id: PropTypes.string,
  }).isRequired,
};

export default VaccineStatusRow;
