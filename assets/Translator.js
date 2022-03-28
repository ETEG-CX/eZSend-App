'use strict';
class Translator {
  constructor() {
    this._locale = this.getLanguage();
  }

  getLanguage() {
    client.get('currentUser.locale').then((data) => {
      const locale = data['currentUser.locale'];
      return locale.substr(0, 2);
    });
  }
}
export default Translator;
