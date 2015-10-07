/*!
 * Combobox Plugin for jQuery, version 0.5.0
 *
 * Copyright 2012, Dell Sala
 * http://dellsala.com/
 * https://github.com/dellsala/Combo-Box-jQuery-Plugin
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Date: 2012-01-15
 */

 /*
  * This has been modified from its original version to
  * work with NocWorx.
  *
  */

(function() {

  jQuery.fn.combobox = function(selectOptions) {

    return this.each(function() {
      var newCombobox = new Combobox(this, selectOptions);
      jQuery.combobox.instances.push(newCombobox);
    });

  };

  jQuery.combobox = {
    instances: []
  };


  var Combobox = function(textInputElement, selectOptions) {
    this.textInputElement = jQuery(textInputElement);
    this.textInputElement.wrap(
      '<span class="combobox" style="position:relative; ' +
      'display:-moz-inline-box; display:inline-block;"/>'
    );
    this.selector = new ComboboxSelector(this);
    this.setSelectOptions(selectOptions);
    this.bindKeypress();
  };

  Combobox.prototype = {

    setSelectOptions: function(selectOptions) {
      this.selector.setSelectOptions(selectOptions);
      this.selector.buildSelectOptionList(this.getValue());
    },

    bindKeypress: function() {
      var thisCombobox = this;
      this.textInputElement.keyup(function(event) {
        if (event.keyCode == Combobox.keys.TAB || event.keyCode == Combobox.keys.SHIFT || event.keyCode == Combobox.keys.ESCAPE) {
          return;
        }
        if (event.keyCode != Combobox.keys.DOWNARROW && event.keyCode != Combobox.keys.UPARROW && event.keyCode != Combobox.keys.ESCAPE && event.keyCode != Combobox.keys.ENTER) {
          thisCombobox.selector.buildSelectOptionList(thisCombobox.getValue());
        }
        thisCombobox.selector.show();
      });
    },

    setValue: function(value) {
      var oldValue = this.textInputElement.val();
      this.textInputElement.val(value);
      if (oldValue != value) {
        this.textInputElement.trigger('change');
      }
      var evt = jQuery.Event("update");
      evt.link = value;
      this.textInputElement.trigger(evt);
    },

    getValue: function() {
      return this.textInputElement.val();
    },

    focus: function() {
      var data = { source: "combobox" };
      this.textInputElement.trigger('focus', data);
    }

  };

  Combobox.keys = {
    UPARROW: 38,
    DOWNARROW: 40,
    ENTER: 13,
    ESCAPE: 27,
    TAB: 9,
    SHIFT: 16
  };



  var ComboboxSelector = function(combobox) {
    this.combobox = combobox;
    this.optionCount = 0;
    this.selectedIndex = -1;
    this.allSelectOptions = [];
    var selectorTop = combobox.textInputElement.outerHeight();
    var selectorWidth = combobox.textInputElement.outerWidth();
    this.selectorElement = jQuery(
      '<div class="combobox_selector" ' +
      'style="display:none; width:' + selectorWidth +
      'px; position:absolute; left: 0; top: ' + selectorTop + 'px;"' +
      '></div>'
    ).insertAfter(this.combobox.textInputElement);
    var thisSelector = this;
    this.keypressHandler = function(e) {
      if (e.keyCode == Combobox.keys.DOWNARROW) {
        thisSelector.selectNext();
      } else if (e.keyCode == Combobox.keys.UPARROW) {
        thisSelector.selectPrevious();
      } else if (e.keyCode == Combobox.keys.ESCAPE) {
        thisSelector.hide();
      } else if (e.keyCode == Combobox.keys.ENTER) {
        if (thisSelector.selectedIndex !== -1) {
          e.preventDefault();
        }
        thisSelector.combobox.focus();
      } else if (e.keyCode == Combobox.keys.TAB) {
        thisSelector.hide();
      }
    };

  };


  ComboboxSelector.prototype = {

    setSelectOptions: function(selectOptions) {
      this.allSelectOptions = selectOptions;
    },

    buildSelectOptionList: function(startingLetters) {
      if (!startingLetters) {
        startingLetters = "";
        this.unselect();
        this.selectorElement.empty();
        return;
      }
      this.unselect();
      this.selectorElement.empty();
      var selectOptions = [];
      this.selectedIndex = -1;
      var i;
      for (i = 0; i < this.allSelectOptions.length; i++) {
        if (startingLetters.length && this.allSelectOptions[i].toLowerCase().match(new RegExp("\\b"+startingLetters.toLowerCase(), 'g'))) {
          selectOptions.push(this.allSelectOptions[i]);
        }
      }
      this.optionCount = selectOptions.length + 2;
      var ulElement = jQuery('<ul class="search-menu"></ul>').appendTo(this.selectorElement);
      if (selectOptions.length) {
        ulElement.append('<li class="menu-label"><i class="fa fa-bars fa-fw fa-sm"></i>' + NocWorx.tr("##LG_MENU_SEARCH##") + '</li>');
      }
      for (i = 0; i < selectOptions.length; i++) {
        ulElement.append('<li>' + selectOptions[i] + '</li>');
      }
      var thisSelector = this;
      this.selectorElement.find('li').click(function(e) {
        var sel = e.jquery ? e : jQuery(e.target);
        var ev = jQuery.Event("keyup");
        ev.which = 13;
        ev.keyCode = 13;
        if (sel.hasClass("menu-label")) {
          e.preventDefault();
          thisSelector.combobox.focus();
        } else {
          thisSelector.select(sel.index());
          thisSelector.combobox.setValue(this.innerHTML);
          thisSelector.combobox.textInputElement.trigger(ev);
          thisSelector.combobox.focus();
        }
      });
      this.selectorElement.mouseover(function(e) {
        thisSelector.unselect();
      });
      this.htmlClickHandler = function() {
        thisSelector.hide();
      };

    },

    show: function() {
      if (this.selectorElement.find('li').length < 1 || this.selectorElement.is(':visible')) {
        return false;
      }
      jQuery('html').keydown(this.keypressHandler);
      this.selectorElement.slideDown('fast');
      jQuery('html').click(this.htmlClickHandler);
      return true;
    },

    hide: function() {
      jQuery('html').unbind('keydown', this.keypressHandler);
      jQuery('html').unbind('click', this.htmlClickHandler);
      this.selectorElement.unbind('click');
      this.unselect();
      this.selectorElement.hide();
    },

    selectNext: function() {
      var newSelectedIndex = this.selectedIndex + 1;
      var selectorCount = this.selectorElement.find('li').length;
      if (newSelectedIndex > selectorCount - 1) {
        newSelectedIndex = 1;
      }
      if (this.selectorElement.find('li:eq(' + newSelectedIndex + ')').hasClass('menu-label')) {
        this.selectedIndex = newSelectedIndex;
        this.selectNext();
      } else {
        this.select(newSelectedIndex);
      }
    },

    selectPrevious: function() {
      var newSelectedIndex = this.selectedIndex - 1;
      var selectorCount = this.selectorElement.find('li').length;
      if (newSelectedIndex < 1) {
        newSelectedIndex = selectorCount - 1;
      }
      if (this.selectorElement.find('li:eq(' + newSelectedIndex + ')').hasClass('menu-label')) {
        this.selectedIndex = newSelectedIndex;
        this.selectPrevious();
      } else {
        this.select(newSelectedIndex);
      }
    },

    select: function(index) {
      this.unselect();
      this.selectorElement.find('li:eq(' + index + ')').addClass('selected');
      this.selectedIndex = index;
    },

    unselect: function() {
      this.selectorElement.find('li').removeClass('selected');
      //this.selectedIndex = -1;
    },

    getSelectedValue: function() {
      if (this.selectedIndex !== -1) {
        if (this.selectorElement.find('li').get(this.selectedIndex).length) {
          return this.selectorElement.find('li').get(this.selectedIndex).innerHTML;
        }
      } else {
        return this.combobox.textInputElement.val();
      }
    }

  };


})();
