import React from 'react';
import { Icon, Popup, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import DispenseInfoPage from './DispenseInfoPage';

const DispenseLogRow = ({ history }) => {

  const test = new Date(history.dateDispensed).toLocaleString('en-US');

  console.log(test);

  return (
    <Table.Row>
      <Table.Cell>
        <i>{test}</i>
      </Table.Cell>
      <Table.Cell>{history.dispenseType}</Table.Cell>
      <Table.Cell>{history.dispensedTo}</Table.Cell>
      <Table.Cell>{history.drug}</Table.Cell>
      <Table.Cell>{history.brand}</Table.Cell>
      <Table.Cell>{history.lotId}</Table.Cell>
      <Table.Cell>{history.quantity} {history.unit}</Table.Cell>
      <Table.Cell textAlign='center'>
        <Popup trigger={<Icon name='user circle' size='large' color='grey'/>}
          content={history.dispensedFrom} size='small' position='right center' inverted/>
      </Table.Cell>
      <Table.Cell textAlign='center'><DispenseInfoPage record={history}/></Table.Cell>
    </Table.Row>
  );
};

DispenseLogRow.propTypes = {
  history: PropTypes.shape({
    drug: PropTypes.string,
    dateDispensed: PropTypes.date,
    dispensedTo: PropTypes.string,
    dispenseType: PropTypes.string,
    brand: PropTypes.string,
    lotId: PropTypes.string,
    dispensedFrom: PropTypes.string,
    quantity: PropTypes.number,
    unit: PropTypes.string,
  }).isRequired,
};

export default DispenseLogRow;
