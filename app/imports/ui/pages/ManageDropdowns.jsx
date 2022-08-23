import React from 'react';
import { Container, Tab, Segment } from 'semantic-ui-react';
import { PAGE_IDS } from '../utilities/PageIDs';
import { DrugNames } from '../../api/drugName/DrugNameCollection';
import { DrugTypes } from '../../api/drugType/DrugTypeCollection';
import { Units } from '../../api/unit/UnitCollection';
import { DrugBrands } from '../../api/drugBrand/DrugBrandCollection';
import { VaccineNames } from '../../api/vaccineName/VaccineNameCollection';
import { VaccineBrands } from '../../api/vaccineBrand/VaccineBrandCollection';
import { SupplyNames } from '../../api/supplyName/SupplyNameCollection';
import { Locations } from '../../api/location/LocationCollection';
import { Sites } from '../../api/site/SiteCollection';
import { DispenseTypes } from '../../api/dispense-type/DispenseTypeCollection';
import ManageSingle from '../components/manage-dropdowns/ManageSingle';
import ManageDrugBrand from '../components/manage-dropdowns/ManageDrugBrand';
import ManageLocation from '../components/manage-dropdowns/ManageLocation';

const drugNamesTab = () => <ManageSingle collection={DrugNames} title={"Drug Names"} name={"drugName"} />;
const drugTypesTab = () => <ManageSingle collection={DrugTypes} title={"Drug Types"} name={"drugType"} />;
const unitsTab = () => <ManageSingle collection={Units} title={"Units"} name={"unit"} />;
const drugBrandsTab = () => <ManageDrugBrand collection={DrugBrands} title={"Drug Brands"} name={"drugBrand"} />;
const vaccineNamesTab = () => <ManageSingle collection={VaccineNames} title={"Vaccine Names"} name={"vaccineName"} />;
const vaccineBrandsTab = () => <ManageSingle collection={VaccineBrands} title={"Vaccine Brands"} name={"vaccineBrand"} />;
const supplyNamesTab = () => <ManageSingle collection={SupplyNames} title={"Supply Names"} name={"supplyName"} />;
const locationsTab = () => <ManageLocation collection={Locations} title={"Locations"} name={"location"} />;
const sitesTab = () => <ManageSingle collection={Sites} title={"Sites"} name={"site"} />;
const dispenseTypesTab = () => <ManageSingle collection={DispenseTypes} title={"Dispense Types"} name={"dispenseType"} />;

const panes = [
  { menuItem: 'Drug Names', render: drugNamesTab },
  { menuItem: 'Drug Types', render: drugTypesTab },
  { menuItem: 'Units', render: unitsTab },
  { menuItem: 'Drug Brands', render: drugBrandsTab },
  { menuItem: 'Vaccine Names', render: vaccineNamesTab },
  { menuItem: 'Vaccine Brands', render: vaccineBrandsTab },
  { menuItem: 'Supply Names', render: supplyNamesTab },
  { menuItem: 'Locations', render: locationsTab },
  { menuItem: 'Sites', render: sitesTab },
  { menuItem: 'Dispense Types', render: dispenseTypesTab },
];

const ManageDropdowns = () => (
  <Container id={PAGE_IDS.MANAGE_DROPDOWNS}>
    <Segment>
      <Tab menu={{ fluid: true, vertical: true, tabular: true, padding: 0 }} panes={panes} />
    </Segment>
  </Container>
);

export default ManageDropdowns;
