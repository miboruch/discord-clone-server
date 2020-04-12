/*
 This object is created as listener to the array.
 If some data in the namespacesArray change, we will loop through
 all items and set listeners for each namespace.

! On initial load we fetch data from the database, and this is
! also triggered.
* 1. subscribe to this listener
* 2. fetch data
* 3. set data to this namespaceArray
* 4. set namespaces listeners
* 5. if new namespace has been created it starts from point 2
 */

module.exports = {
  namespacesArray: [],
  namespacesListener: function(value) {},

  set namespaces(value) {
    /* check if value is an array or an single object */
    if (value.length) {
      this.namespacesArray = value;
      this.namespacesListener(value);
    } else {
      this.namespacesArray = [...this.namespacesArray, value];
      this.namespacesListener([value]);
      /* put a single object as an array that we can use map later on */
    }
  },

  get namespaces() {
    return this.namespacesArray;
  },

  subscribe: function(listener) {
    this.namespacesListener = listener;
  }
};
