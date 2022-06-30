import React, { useState, useEffect } from 'react';
import { Header, Table, Divider, Dropdown, Pagination, Grid, Input, Loader, Icon, Popup, Tab, Message } from 'semantic-ui-react';
import { withTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';
import { _ } from 'meteor/underscore';
import moment from 'moment';
import { Drugs } from '../../../api/drug/DrugCollection';
import { DrugTypes } from '../../../api/drugType/DrugTypeCollection';
import { Units } from '../../../api/unit/UnitCollection';
import { DrugBrands } from '../../../api/drugBrand/DrugBrandCollection';
import { Locations } from '../../../api/location/LocationCollection';
import { PAGE_IDS } from '../../utilities/PageIDs';
import { COMPONENT_IDS } from '../../utilities/ComponentIDs';
import DrugStatusRow from './DrugStatusRow';
import { fetchCounts, fetchField, getOptions } from '../../utilities/Functions';
import { cloneDeep } from 'lodash';

// convert array to dropdown options
const getFilters = (arr) => [{ key: 'All', value: 0, text: 'All' }, ...getOptions(arr)];

const recordOptions = [
  // { key: 0, value: 10, text: '10' },
  { key: 1, value: 25, text: '25' },
  { key: 2, value: 50, text: '50' },
  { key: 3, value: 100, text: '100' },
];

const statusOptions = [
  { key: 'All', value: 0, text: 'All' },
  { key: 1, value: 'In Stock', text: 'In Stock' },
  { key: 2, value: 'Low Stock', text: 'Low Stock' },
  { key: 3, value: 'Out of Stock', text: 'Out of stock' },
];

const currentDate = moment();

// Render the form.
const DrugStatus = ({ ready, drugs, drugTypes, units, brands, locations, countL, countN }) => {
  const [filteredMedications, setFilteredMedications] = useState([]);
  useEffect(() => {
    setFilteredMedications(drugs);
  }, [drugs]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageNo, setPageNo] = useState(1);
  const [typeFilter, setTypeFilter] = useState(0);
  const [brandFilter, setBrandFilter] = useState(0);
  const [locationFilter, setLocationFilter] = useState(0);
  const [statusFilter, setStatusFilter] = useState(0);
  const [maxRecords, setMaxRecords] = useState(25);
  const [visible, setVisible] = useState(JSON.parse(window.localStorage.getItem("visible")) ?? true);

  // handles filtering
  useEffect(() => {
    let filter = cloneDeep(drugs);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filter = filter.filter(({ drug, lotIds }) => (
        drug.toLowerCase().includes(query.toLowerCase()) ||
          lotIds.findIndex(({ brand }) => brand.toLowerCase().includes(query)) !== -1 ||
          lotIds.findIndex(({ expire }) => (expire && expire.includes(query))) !== -1 ||
          lotIds.findIndex(({ location }) => location.toLowerCase().includes(query)) !== -1 ||
          lotIds.findIndex(({ lotId }) => lotId.toLowerCase().includes(query)) !== -1
      ));
    }
    if (typeFilter) {
      filter = filter.filter((medication) => medication.drugType.includes(typeFilter));
    }
    if (brandFilter) {
      // filter = filter.filter((medication) => medication.brand === brandFilter);
      filter = filter.filter((medication) => medication.lotIds.findIndex(
        lotId => lotId.brand === brandFilter,
      ) !== -1);
    }
    if (locationFilter) {
      // filter = filter.filter((medication) => medication.location === locationFilter);
      filter = filter.filter((medication) => medication.lotIds.findIndex(
        lotId => lotId.location === locationFilter,
      ) !== -1);
    }
    if (statusFilter) {
      filter = filter.filter((drug) => {
        if (statusFilter === 'In Stock') {
          return drug.sum >= drug.minQuantity;
        }
        if (statusFilter === 'Low Stock') {
          return (drug.sum > 0 && drug.sum < drug.minQuantity);
        }
        if (statusFilter === 'Out of Stock') {
          return drug.sum === 0;
        }
        return true;
      });
    }
    setFilteredMedications(filter);
  }, [searchQuery, typeFilter, brandFilter, locationFilter, statusFilter]);

  const handleSearch = (event, { value }) => setSearchQuery(value);
  const handleTypeFilter = (event, { value }) => setTypeFilter(value);
  const handleBrandFilter = (event, { value }) => setBrandFilter(value);
  const handleLocationFilter = (event, { value }) => setLocationFilter(value);
  const handleStatusFilter = (event, { value }) => setStatusFilter(value);
  const handleRecordLimit = (event, { value }) => setMaxRecords(value);

  const [mobile, setMobile] = useState(false);

  const handleMobile = () => {
    if (window.innerWidth < 7200) {
      setMobile(true);
    } else {
      setMobile(true);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleMobile);
  });

  const handleDismiss = () => {
    setVisible(!visible);
    window.localStorage.setItem("visible", JSON.stringify(!visible));
  };

  if (ready) {
    return (
      <Tab.Pane id={PAGE_IDS.MED_STATUS} className='status-tab'>
        <Header as="h2">
          <Header.Content>
              Drug Inventory Status
            <Header.Subheader>
              <i>Use the search filter to check for a specific drug or
                  use the dropdown filters.</i>
            </Header.Subheader>
          </Header.Content>
        </Header>
        <Grid>
          <Grid.Column width={4}>
            <Popup
              trigger={<Input placeholder='Filter by drug name...' icon='search'
                onChange={handleSearch} value={searchQuery} id={COMPONENT_IDS.STATUS_FILTER}/>}
              content='This allows you to filter the Inventory by drug, brand, LotID, location, and expiration.'
              inverted
            />
          </Grid.Column>
        </Grid>
        <Divider/>
        <Grid divided columns="equal" style={{ display: 'flex' }}>
          <Grid.Row textAlign='center'>
            <Grid.Column>
                Drug Type: {' '}
              <Dropdown inline options={getFilters(drugTypes)} search
                onChange={handleTypeFilter} value={typeFilter} id={COMPONENT_IDS.MEDICATION_TYPE}/>
            </Grid.Column>
            <Grid.Column>
                Drug Brand: {' '}
              <Dropdown inline options={getFilters(brands)} search
                onChange={handleBrandFilter} value={brandFilter} id={COMPONENT_IDS.MEDICATION_BRAND}/>
            </Grid.Column>
            <Grid.Column>
                Drug Location: {' '}
              <Dropdown inline options={getFilters(locations)} search
                onChange={handleLocationFilter} value={locationFilter}
                id={COMPONENT_IDS.MEDICATION_LOCATION}/>
            </Grid.Column>
            <Grid.Column>
                Inventory Status: {' '}
              <Dropdown inline options={statusOptions} search
                onChange={handleStatusFilter} value={statusFilter} id={COMPONENT_IDS.INVENTORY_STATUS}/>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Divider/>

        {
          (countL + countN) &&
          (
            visible ?
              <Message warning
                onDismiss={handleDismiss}
                header="Some drugs are low on stock!"
                content={`${countL} drugs are low on stock and ${countN} drugs are out of stock.`}
              />
              :
              <div className='warning-div' onClick={handleDismiss}>Expand warning message</div>
          )
        }

        <div>
            Records per page: {' '}
          <Dropdown inline options={recordOptions}
            onChange={handleRecordLimit} value={maxRecords} id={COMPONENT_IDS.NUM_OF_RECORDS}/>
            Total count: {filteredMedications.length}
        </div>
        <Table selectable color='blue' className='status-wrapped' unstackable>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell/>
              <Table.HeaderCell>Drug</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Total Quantity</Table.HeaderCell>
              <Table.HeaderCell>Unit</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell/>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {
              filteredMedications.slice((pageNo - 1) * maxRecords, pageNo * maxRecords)
                .map(med => <DrugStatusRow key={med._id} med={med} drugTypes={drugTypes} locations={locations} units={units} brands={brands} />)
            }
          </Table.Body>

          <Table.Footer>
            <Table.Row>
              <Table.HeaderCell colSpan="7">
                { mobile === false &&
                    <div>
                      <Pagination
                        totalPages={Math.ceil(filteredMedications.length / maxRecords)}
                        activePage={pageNo}
                        onPageChange={(event, data) => {
                          setPageNo(data.activePage);
                          window.scrollTo(0, 0);
                        }}
                        ellipsisItem={{ content: <Icon name='ellipsis horizontal'/>, icon: true }}
                        firstItem={{ content: <Icon name='angle double left'/>, icon: true }}
                        lastItem={{ content: <Icon name='angle double right'/>, icon: true }}
                        prevItem={{ content: <Icon name='angle left'/>, icon: true }}
                        nextItem={{ content: <Icon name='angle right'/>, icon: true }}
                      />
                    </div>
                }
              </Table.HeaderCell>
            </Table.Row>
          </Table.Footer>
        </Table>
        { mobile === true &&
        <Pagination
          totalPages={Math.ceil(filteredMedications.length / maxRecords)}
          activePage={pageNo}
          onPageChange={(event, data) => setPageNo(data.activePage)}
          ellipsisItem={{ content: <Icon name='ellipsis horizontal'/>, icon: true }}
          firstItem={null}
          lastItem={null}
          siblingRange={1}
          boundaryRange={0}
        />
        }
      </Tab.Pane>
    );
  }
  return (<Loader active>Getting data</Loader>);
};

DrugStatus.propTypes = {
  drugs: PropTypes.array.isRequired,
  drugTypes: PropTypes.array.isRequired,
  units: PropTypes.array.isRequired,
  brands: PropTypes.array.isRequired,
  locations: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
  countL: PropTypes.number.isRequired,
  countN: PropTypes.number.isRequired,
};

// withTracker connects Meteor data to React components. https://guide.meteor.com/react.html#using-withTracker
export default withTracker(() => {
  const drugSub = Drugs.subscribeDrug();
  const drugTypeSub = DrugTypes.subscribe();
  const unitSub = Units.subscribe();
  const drugBrandSub = DrugBrands.subscribe();
  const locationSub = Locations.subscribe();
  // Determine if the subscription is ready
  const ready = drugSub.ready() && drugTypeSub.ready() && unitSub.ready() && drugBrandSub.ready() && locationSub.ready();
  // Get the Drug documents and sort them by name.
  const drugs = Drugs.find({}, { sort: { drug: 1 } }).fetch();
  const drugTypes = fetchField(DrugTypes, "drugType");
  const units = fetchField(Units, "unit");
  const brands = fetchField(DrugBrands, "drugBrand");
  const locations = fetchField(Locations, "location");
  // add is expired and total quantity to drugs
  drugs.forEach(doc => {
    let sum = 0;
    doc.lotIds.forEach(o => {
      const expire = o.expire;
      const isExpired = expire ? (currentDate > moment(expire)) : false;
      if (!isExpired)
        sum += o.quantity;
      o.isExpired = isExpired;
    });
    doc.sum = sum;
  });
  const [countL, countN] = fetchCounts(drugs);
  return {
    drugs,
    drugTypes,
    units,
    brands,
    locations,
    ready,
    countL,
    countN,
  };
})(DrugStatus);
