// #import "Foundation/JSObject.js"
// #import "Foundation/JSLocale.js"
// #import "Foundation/JSCalendar.js"
// #import "Foundation/JSBundle.js"
/* global JSClass, JSObject, JSDateFormatter, JSLocale, JSCustomProperty, JSCalendar, JSDynamicProperty, JSBundle */
'use strict';

// http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_Patterns
// Currently partially implemented
// - Missing Y - Year in "Week of Year"
// - Missing u - Extended Year
// - Missing U - Cylic Year Name
// - Missing Q - Quarter
// - Missing q - Standalone Quarter
// - Missing w - Week of Year
// - Missing W - Week of Month
// - Missing F - Day of Week in Month
// - Missing g - Modified Julian day
// - Missing j - template hour
// - Missing A - milliseconds in day
// - Missing Z.4 - Full Timezone name
// - Missing v, V, x, and X - Various timezone labels

(function(){

var OverridableLocaleProperty = function(stringKey){
    if (this === undefined){
        return new OverridableLocaleProperty(stringKey);
    }
    this.stringKey = stringKey;
};

OverridableLocaleProperty.prototype = Object.create(JSCustomProperty.prototype);

OverridableLocaleProperty.prototype.define = function(C, publicKey, extensions){
    var privateKey = '_' + publicKey;
    Object.defineProperty(C.prototype, privateKey, {
        writable: true,
        value: null
    });
    var stringKey = this.stringKey;
    Object.defineProperty(C.prototype, publicKey, {
        get: function OverridableLocaleProperty_get(){
            if (this[privateKey] !== null){
                return this[privateKey];
            }
            return lazy.bundle.localizedString(stringKey, undefined, this._locale);
        },
        set: function OverridableLocaleProperty_set(value){
            this[privateKey] = value;
        }
    });
};

JSClass("JSDateFormatter", JSObject, {

    init: function(){
        this.initWithLocale(JSLocale.current);
    },

    initWithLocale: function(locale){
        this.locale = locale;
    },

    locale: JSDynamicProperty('_locale', null),

    setLocale: function(locale){
        this._locale = locale;
        this._localeCalendar = JSCalendar.initWithIdentifier(locale.calendarIdentifier);
    },

    calendar: JSDynamicProperty('_calendar', null),
    _localeCalendar: null,

    getCalendar: function(){
        if (this._calendar !== null){
            return this._calendar;
        }
        return this._localeCalendar;
    },

    timezone: JSDynamicProperty('_timezone', null),

    getTimezone: function(){
        if (this._timezone !== null){
            return this._timezone;
        }
        return this.calendar.timezone;
    },

    dateFormat: JSDynamicProperty('_dateFormat', null),

    getDateFormat: function(){
        if (this._dateFormat !== null){
            return this._dateFormat;
        }
        // TODO: get the format for date and time styles
    },

    dateStyle: JSDynamicProperty('_dateStyle', null),
    timeStyle: JSDynamicProperty('_timeStyle', null),

    stringFromDate: function(date){
        var cal = this.calendar;
        var units = JSCalendar.Unit.all;
        var components = cal.componentsFromDate(units, date, this._timezone);
        var format = this.dateFormat;
        var i = 0;
        var l = format.length;
        var out = '';
        var symbol;
        var n;
        while (i < l){
            switch (format[i]){
                case "'":
                    ++i;
                    if (i < l && format[i] == "'"){
                        out += "'";
                        ++i;
                    }else{
                        while (i < l){
                            while (i < l && format[i] != "'"){
                                out += format[i];
                                ++i;
                            }
                            ++i;
                            if (i < l && format[i] == "'"){
                                out += "'";
                                ++i;   
                            }else{
                                break;
                            }
                        }
                    }
                    break;
                case 'G':
                case 'y':
                case 'M':
                case 'L':
                case 'd':
                case 'E':
                case 'e':
                case 'c':
                case 'a':
                case 'h':
                case 'H':
                case 'K':
                case 'k':
                case 'm':
                case 's':
                case 'S':
                case 'z':
                case 'Z':
                case 'O':
                    symbol = format[i];
                    n = 1;
                    ++i;
                    while (i < l && format[i] == symbol){
                        ++i;
                        ++n;
                    }
                    out += this['_' + symbol](n, date, components);
                    break;
                default:
                    out += format[i];
                    ++i;
                    break;
            }
        }
        return out;
    },

    narrowEraSymbols: OverridableLocaleProperty("dateFormatter.eras.narrow"),
    abbreviatedEraSymbols: OverridableLocaleProperty("dateFormatter.eras.abbreviated"),
    fullEraSymbols: OverridableLocaleProperty("dateFormatter.eras.full"),

    narrowMonthSymbols: OverridableLocaleProperty("dateFormatter.months.narrow"),
    abbreviatedMonthSymbols: OverridableLocaleProperty("dateFormatter.months.abbreviated"),
    fullMonthSymbols: OverridableLocaleProperty("dateFormatter.months.full"),

    narrowStandaloneMonthSymbols: OverridableLocaleProperty("dateFormatter.standaloneMonths.narrow"),
    abbreviatedStandaloneMonthSymbols: OverridableLocaleProperty("dateFormatter.standaloneMonths.abbreviated"),
    fullStandaloneMonthSymbols: OverridableLocaleProperty("dateFormatter.standaloneMonths.full"),

    narrowWeekdaySymbols: OverridableLocaleProperty("dateFormatter.weekdays.narrow"),
    shortWeekdaySymbols: OverridableLocaleProperty("dateFormatter.weekdays.short"),
    abbreviatedWeekdaySymbols: OverridableLocaleProperty("dateFormatter.weekdays.abbreviated"),
    fullWeekdaySymbols: OverridableLocaleProperty("dateFormatter.weekdays.full"),

    narrowStandaloneWeekdaySymbols: OverridableLocaleProperty("dateFormatter.standaloneWeekdays.narrow"),
    shortStandaloneWeekdaySymbols: OverridableLocaleProperty("dateFormatter.standaloneWeekdays.short"),
    abbreviatedStandaloneWeekdaySymbols: OverridableLocaleProperty("dateFormatter.standaloneWeekdays.abbreviated"),
    fullStandaloneWeekdaySymbols: OverridableLocaleProperty("dateFormatter.standaloneWeekdays.full"),

    amSymbol: OverridableLocaleProperty("dateFormatter.am"),
    pmSymbol: OverridableLocaleProperty("dateFormatter.pm"),

    _G: function(n, date, components){
        if (n < 4){
            return this.abbreviatedEraSymbols[components.era];
        }
        if (n < 5){
            return this.fullEraSymbols[components.era];
        }
        return this.narrowEraSymbols[components.era];
    },

    _y: function(n, date, components){
        if (n == 1){
            return components.year.toString();
        }
        if (n == 2){
            return "%02d".sprintf(components.year % 100);
        }
        return "%%0%dd".sprintf(n).sprintf(components.year);
    },

    _M: function(n, date, components){
        if (n == 1){
            return components.month.toString();
        }
        if (n == 2){
            return "%02d".sprintf(components.month);
        }
        if (n == 3){
            return this.abbreviatedMonthSymbols[components.month - 1];
        }
        if (n == 4){
            return this.fullMonthSymbols[components.month - 1];
        }
        return this.narrowMonthSymbols[components.month - 1];
    },

    _L: function(n, date, components){
        if (n == 1){
            return components.month.toString();
        }
        if (n == 2){
            return "%02d".sprintf(components.month);
        }
        if (n == 3){
            return this.abbreviatedStandaloneMonthSymbols[components.month - 1];
        }
        if (n == 4){
            return this.fullStandaloneMonthSymbols[components.month - 1];
        }
        return this.narrowStandaloneMonthSymbols[components.month - 1];
    },

    _d: function(n, date, components){
        if (n == 1){
            return components.day.toString();
        }
        return "%02d".sprintf(components.day);
    },

    _E: function(n, date, components){
        if (n < 4){
            return this.abbreviatedWeekdaySymbols[components.weekday - 1];
        }
        if (n == 4){
            return this.fullWeekdaySymbols[components.weekday - 1];
        }
        if (n == 5){
            return this.narrowWeekdaySymbols[components.weekday - 1];
        }
        return this.shortWeekdaySymbols[components.weekday - 1];
    },

    _e: function(n, date, components){
        if (n == 1){
            return components.weekday.toString();
        }
        if (n === 2){
            return "%02d".sprintf(components.weekday);
        }
        if (n == 3){
            return this.abbreviatedWeekdaySymbols[components.weekday - 1];
        }
        if (n == 4){
            return this.fullWeekdaySymbols[components.weekday - 1];
        }
        if (n == 5){
            return this.narrowWeekdaySymbols[components.weekday - 1];
        }
        return this.shortWeekdaySymbols[components.weekday - 1];
    },

    _c: function(n, date, components){
        if (n == 1){
            return components.weekday.toString();
        }
        if (n === 2){
            return "%02d".sprintf(components.weekday);
        }
        if (n == 3){
            return this.abbreviatedStandaloneWeekdaySymbols[components.weekday - 1];
        }
        if (n == 4){
            return this.fullStandaloneWeekdaySymbols[components.weekday - 1];
        }
        if (n == 5){
            return this.narrowStandaloneWeekdaySymbols[components.weekday - 1];
        }
        return this.shortStandaloneWeekdaySymbols[components.weekday - 1];
    },

    _a: function(n, date, components){
        if (components.hour >= 12){
            return this.pmSymbol;
        }
        return this.amSymbol;
    },

    _h: function(n, date, components){
        var h = components.hour % 12;
        if (h === 0){
            return "12";
        }
        if (n == 1){
            return h.toString();
        }
        return "%02d".sprintf(h);
    },

    _H: function(n, date, components){
        if (n == 1){
            return components.hour;
        }
        return "%02d".sprintf(components.hour);
    },

    _K: function(n, date, components){
        var h = components.hour % 12;
        if (n == 1){
            return h.toString();
        }
        return "%02d".sprintf(h);
    },

    _k: function(n, date, components){
        var h = components.hour + 1;
        if (n == 1){
            return h.toString();
        }
        return "%02d".sprintf(h);
    },

    _m: function(n, date, components){
        if (n === 1){
            return components.minute.toString();
        }
        return "%02d".sprintf(components.minute);
    },

    _s: function(n, date, components){
        if (n === 1){
            return components.second.toString();
        }
        return "%02d".sprintf(components.second);
    },

    _S: function(n, date, components){
        var ms = components.millisecond;
        if (n == 1){
            return Math.floor(ms / 100).toString();
        }
        if (n == 2){
            return Math.floor(ms / 10).toString();
        }
        return Math.floor((ms * Math.pow(10, n - 3))).toString();
    },

    _z: function(n, date, components){
        if (n < 4){
            return components.timezone.abbreviationForDate(date);
        }
        return this._Z(4, date, components);
    },

    _Z: function(n, date, components){
        var running = Math.floor(components.timezone.timeIntervalFromUTCForDate(date));
        var negative = running < 0;
        var sign = '+';
        if (negative){
            running = -running;
            sign = '-';
        }
        var s = running % 60;
        running = (running - s) / 60;
        var m = running % 60;
        running = (running - m) / 60;
        var h = running;
        if (n == -1){
            if (m === 0 && s === 0){
                return "GMT%s%d".sprintf(sign, h);
            }
            if (s === 0){
                return "GMT%s%d:%02d".sprintf(sign, h, m);
            }
            return "GMT%s%d:%02d:%02d".sprintf(sign, h, m, s);
        }
        if (n < 4){
            if (s === 0){
                return "%s%02d%02d".sprintf(sign, h, m);
            }
            return "%s%02d%02d%02d".sprintf(sign, h, m, s);
        }
        if (n === 4){
            if (s === 0){
                return "GMT%s%d:%02d".sprintf(sign, h, m);
            }
            return "GMT%s%d:%02d:%02d".sprintf(sign, h, m, s);
        }
        if (h === 0 && m === 0 && s === 0){
            return "Z";
        }
        if (s === 0){
            return "%s%02d:%02d".sprintf(sign, h, m);
        }
        return "%s%02d:%02d:%02d".sprintf(sign, h, m, s);
    },

    _O: function(n, date, components){
        if (n < 4){
            return this._Z(-1, date, components);
        }
        return this._Z(4, date, components);
    }

});

JSDateFormatter.DateStyle = {
    none: 0,
    short: 1,
    medium: 2,
    long: 3,
    full: 4
};

JSDateFormatter.TimeStyle = {
    none: 0,
    short: 1,
    medium: 2,
    long: 3,
    full: 4
};

JSDateFormatter.Field = {
    none:           0,
    era:            1 << 0,
    year:           1 << 1,
    month:          1 << 2,
    weeekday:       1 << 3,
    day:            1 << 4,
    hour:           1 << 5,
    minute:         1 << 6,
    second:         1 << 7,
    millisecond:    1 << 8,
    ampm:           1 << 9,
};

var lazy = Object.create({}, {

    bundle: {
        configurable: true,
        get: function(){
            Object.defineProperty(this, 'bundle', {value: JSBundle.initWithIdentifier("io.breakside.JSKit.Foundation") });
            return this.bundle;
        }
    },

});

})();