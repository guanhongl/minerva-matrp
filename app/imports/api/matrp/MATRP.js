import { Meteor } from 'meteor/meteor';
import { Stuffs } from '../stuff/StuffCollection';
import { AdminProfiles } from '../user/AdminProfileCollection';
import { UserProfiles } from '../user/UserProfileCollection';
import { SuperUserProfiles } from '../user/SuperUserProfileCollection';
import { DrugNames } from '../drugName/DrugNameCollection';
import { DrugTypes } from '../drugType/DrugTypeCollection';
import { Units } from '../unit/UnitCollection';
import { DrugBrands } from '../drugBrand/DrugBrandCollection';
import { VaccineNames } from '../vaccineName/VaccineNameCollection';
import { VaccineBrands } from '../vaccineBrand/VaccineBrandCollection';
import { SupplyNames } from '../supplyName/SupplyNameCollection';
import { Locations } from '../location/LocationCollection';
import { Sites } from '../site/SiteCollection';
import { Drugs } from '../drug/DrugCollection';
import { Vaccines } from '../vaccine/VaccineCollection';
import { Historicals } from '../historical/HistoricalCollection';
import { Supplys } from '../supply/SupplyCollection';
import { PendingUsers } from '../pending-user/PendingUserCollection';

class MATRPClass {
  collections;

  collectionLoadSequence;

  collectionAssociation;

  constructor() {
    // list of all the MATRP collections
    this.collections = [
      AdminProfiles,
      Stuffs,
      UserProfiles,
      SuperUserProfiles,
      DrugNames,
      DrugTypes,
      Units,
      DrugBrands,
      VaccineNames,
      VaccineBrands,
      SupplyNames,
      Locations,
      Sites,
      Drugs,
      Vaccines,
      Historicals,
      Supplys,
      PendingUsers,
    ];

    /*
     * A list of collection class instances in the order required for them to be sequentially loaded from a file.
     */
    // this.collectionLoadSequence = [
    //   AdminProfiles,
    //   UserProfiles,
    //   SuperUserProfiles,
    //   Stuffs,
    //   DrugTypes,
    //   Locations,
    //   Sites,
    //   Drugs,
    //   Vaccines,
    //   Historicals,
    //   Supplys,
    //   PendingUsers,
    // ];

    this.collectionLoadSequence = [
      Drugs,
      Vaccines,
      Supplys,
    ];

    this.drugs = Drugs;
    this.vaccines = Vaccines;
    this.supplies = Supplys;
    this.history = Historicals;
    // profiles
    this.USER = UserProfiles;
    this.SUPERUSER = SuperUserProfiles;
    this.ADMIN = AdminProfiles;

    /*
     * An object with keys equal to the collection name and values the associated collection instance.
     */
    this.collectionAssociation = {};
    this.collections.forEach((collection) => {
      this.collectionAssociation[collection.getCollectionName()] = collection;
    });

  }

  /**
   * Return the collection class instance given its name.
   * @param collectionName The name of the collection.
   * @returns The collection class instance.
   * @throws { Meteor.Error } If collectionName does not name a collection.
   */
  getCollection(collectionName) {
    // console.log('MATRP', collectionName, this.collectionAssociation);
    const collection = this.collectionAssociation[collectionName];
    if (!collection) {
      throw new Meteor.Error(`Called MARTP.getCollection with unknown collection name: ${collectionName}`);
    }
    return collection;
  }
}

export const MATRP = new MATRPClass();
