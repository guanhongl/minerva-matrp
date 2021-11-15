import React from 'react';
import { Icon, Popup, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import DispenseInfoPage from './DispenseInfoPage';

const DispenseLogRow = ({ history }) => (
  <Table.Row>
    <Table.Cell>
      <i>{history.dateDispensed.toLocaleString('en-CA')}</i>
    </Table.Cell>
    <Table.Cell>{history.inventoryType}</Table.Cell>
    <Table.Cell>{history.dispenseType}</Table.Cell>
    <Table.Cell>{history.dispensedTo}</Table.Cell>
    <Table.Cell>{history.name}</Table.Cell>
    <Table.Cell>
      <Popup trigger={<Icon name='user circle' size='large' color='grey'/>}
        content={history.dispensedFrom} size='small' position='right center' inverted/>
    </Table.Cell>
    <Table.Cell><DispenseInfoPage record={history}/></Table.Cell>
  </Table.Row>
);

DispenseLogRow.propTypes = {
  history: PropTypes.shape({
    name: PropTypes.string,
    inventoryType: PropTypes.string,
    dateDispensed: PropTypes.date,
    dispensedTo: PropTypes.string,
    dispenseType: PropTypes.string,
    brand: PropTypes.string,
    dispensedFrom: PropTypes.string,
  }).isRequired,
};

export default DispenseLogRow;
