import React, { useState } from 'react';
import { Icon, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import SupplyInfoPage from './SupplyInfoPage';
import { Supplys } from '../../../api/supply/SupplyCollection';
import { removeItMethod, updateMethod } from '../../../api/base/BaseCollection.methods';

const SupplyStatusRow = ({ supply, supplyTypes, locations }) => {
  const [isOpen, setIsOpen] = useState(false);
  const handleOpen = () => setIsOpen(!isOpen);

  const status = Math.floor((supply.sum / supply.minQuantity) * 100);
  const getColor = () => {
    let color;
    if (supply.sum >= supply.minQuantity) { // range [min, inf)
      color = 'green';
    } else if (supply.sum > 0 && supply.sum < supply.minQuantity) { // range (0, min]
      color = 'yellow';
    } else { // range (0)
      color = 'red';
    }
    return color;
  };

  const deleteSupply = () => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to delete ${supply.supply}?`,
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
          const collectionName = Supplys.getCollectionName();
          removeItMethod.callPromise({ collectionName, instance: supply._id })
            .then(() => swal('Success', `${supply.supply} deleted successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  const deleteLot = (uuid) => {
    swal({
      title: 'Are you sure?',
      text: `Do you really want to delete ${supply.supply}?`,
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
          const collectionName = Supplys.getCollectionName();
          const exists = Supplys.findOne({ _id: supply._id });
          const { stock } = exists;
          const targetIndex = stock.findIndex((obj => obj._id === uuid));
          stock.splice(targetIndex, 1);
          const updateData = { id: supply._id, stock };
          updateMethod.callPromise({ collectionName, updateData })
            .then(() => swal('Success', `${supply.supply} updated successfully`, 'success', { buttons: false, timer: 3000 }))
            .catch(error => swal('Error', error.message, 'error'));
        }
      });
  };

  return (
    <>
      {/* the supply row */}
      <Table.Row id={COMPONENT_IDS.SUPPLY_STATUS_ROW}>
        <Table.Cell className='caret' onClick={handleOpen}>
          <Icon name={`caret ${isOpen ? 'down' : 'up'}`} />
        </Table.Cell>
        <Table.Cell>{supply.supply}</Table.Cell>
        <Table.Cell>{supply.supplyType}</Table.Cell>
        <Table.Cell>{supply.sum}</Table.Cell>
        <Table.Cell>
          <>
            <Icon color={getColor()} name='circle' />
            <span>{status}%</span>
          </>
        </Table.Cell>
        <Table.Cell>
          <Icon name='trash alternate' onClick={deleteSupply} />
        </Table.Cell>
      </Table.Row>

      {/* the stock row */}
      <Table.Row style={{ display: isOpen ? 'table-row' : 'none' }}>
        <Table.Cell colSpan={6} className='lot-row'>
          <Table color='blue' unstackable>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Location</Table.HeaderCell>
                <Table.HeaderCell>Quantity</Table.HeaderCell>
                <Table.HeaderCell>Donated</Table.HeaderCell>
                <Table.HeaderCell/>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {
                supply.stock.map(({ _id: uuid, location, quantity, donated, donatedBy }, index) => (
                  <Table.Row key={index}>
                    <Table.Cell>{location}</Table.Cell>
                    <Table.Cell>{quantity}</Table.Cell>
                    <Table.Cell>
                      {
                        donated &&
                        <Icon name='check' color='green'/>
                      }
                    </Table.Cell>
                    <Table.Cell className='icons'>
                      <SupplyInfoPage info={supply} detail={supply.stock[index]} supplyTypes={supplyTypes} locations={locations} />
                      <Icon name='trash alternate' onClick={() => deleteLot(uuid)} />
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

SupplyStatusRow.propTypes = {
  supply: PropTypes.shape({
    supply: PropTypes.string,
    supplyType: PropTypes.string,
    stock: PropTypes.array,
    minQuantity: PropTypes.number,
  }).isRequired,
};

export default SupplyStatusRow;
