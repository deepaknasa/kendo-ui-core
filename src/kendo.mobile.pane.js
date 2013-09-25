kendo_module({
    id: "mobile.pane",
    name: "Pane",
    category: "mobile",
    description: "Mobile Pane",
    depends: [ "mobile.view", "mobile.loader" ],
    hidden: true
});

(function($, undefined) {
    var kendo = window.kendo,
        mobile = kendo.mobile,
        roleSelector = kendo.roleSelector,
        ui = mobile.ui,
        Widget = ui.Widget,
        ViewEngine = mobile.ViewEngine,
        View = ui.View,
        Loader = mobile.ui.Loader,

        EXTERNAL = "external",
        HREF = "href",
        DUMMY_HREF = "#!",

        NAVIGATE = "navigate",
        VIEW_SHOW = "viewShow",
        SAME_VIEW_REQUESTED = "sameViewRequested",

        WIDGET_RELS = /popover|actionsheet|modalview|drawer/,
        BACK = "#:back",

        attrValue = kendo.attrValue,
        // navigation element roles
        buttonRoles = "button backbutton detailbutton listview-link",
        linkRoles = "tab";

    var Pane = Widget.extend({
        init: function(element, options) {
            var that = this;

            Widget.fn.init.call(that, element, options);

            options = that.options;
            element = that.element;

            element.addClass("km-pane");

            if (that.options.collapsible) {
                element.addClass("km-collapsible-pane");
            }

            that.history = [];

            that.loader = new Loader(element, {
                loading: that.options.loading
            });

            that.viewEngine = new ViewEngine({
                container: element,
                transition: options.transition,
                rootNeeded: !options.initial,
                serverNavigation: options.serverNavigation,
                remoteViewURLPrefix: options.root || "",
                layout: options.layout,
                loader: that.loader
            });

            that.viewEngine.bind(VIEW_SHOW, function(e) {
                that.trigger(VIEW_SHOW, e);
            });

            that.viewEngine.bind(SAME_VIEW_REQUESTED, function(e) {
                that.trigger(SAME_VIEW_REQUESTED, e);
            });

            that.viewEngine.bind("viewTypeDetermined", function(e) {
                if (!e.remote || !that.options.serverNavigation)  {
                    that.trigger(NAVIGATE, { url: e.url });
                }
            });

            this._setPortraitWidth();

            kendo.onResize(function() {
                that._setPortraitWidth();
            });

            that._setupAppLinks();
        },

        navigateToInitial: function() {
            var initial = this.options.initial;

            if (initial) {
                this.navigate(initial);
            }
        },

        options: {
            name: "Pane",
            portraitWidth: "",
            transition: "",
            layout: "",
            collapsible: false,
            initial: null,
            loading: "<h1>Loading...</h1>"
        },

        events: [
            NAVIGATE,
            VIEW_SHOW,
            SAME_VIEW_REQUESTED
        ],

        append: function(html) {
            return this.viewEngine.append(html);
        },

        destroy: function() {
            Widget.fn.destroy.call(this);

            kendo.destroy(this.element);
        },

        navigate: function(url, transition) {
            var that = this,
                history = that.history;

            if (url instanceof View) {
                url = url.id;
            }

            if (url === BACK) {
                if (history.length === 1) {
                    return;
                }

                history.pop();
                url = history[history.length - 1];
            } else {
                history.push(url);
            }

            that.viewEngine.showView(url, transition);
        },

        hideLoading: function() {
            this.loader.hide();
        },

        showLoading: function() {
            this.loader.show();
        },

        changeLoadingMessage: function(message) {
            this.loader.changeMessage(message);
        },

        view: function() {
            return this.viewEngine.view();
        },

        _setPortraitWidth: function() {
            var width,
                portraitWidth = this.options.portraitWidth;

            if (portraitWidth) {
                width = kendo.mobile.application.element.is(".km-vertical") ? portraitWidth : "auto";
                this.element.css("width", width);
            }
        },

        _setupAppLinks: function() {
            this.element.handler(this)
                .on("down", roleSelector(linkRoles), "_mouseup")
                .on("up", roleSelector(buttonRoles), "_mouseup")
                .on("click", roleSelector(linkRoles + " " + buttonRoles), "_appLinkClick");
        },

        _appLinkClick: function (e) {
            var remote = e.currentTarget.href && e.currentTarget.href[0] !== "#" && this.options.serverNavigation;

            if(!remote && attrValue($(e.currentTarget), "rel") != EXTERNAL) {
                e.preventDefault();
            }
        },

        _mouseup: function(e) {
            if (e.which > 1 || e.isDefaultPrevented()) {
                return;
            }

            var pane = this,
                link = $(e.currentTarget),
                transition = attrValue(link, "transition"),
                rel = attrValue(link, "rel") || "",
                target = attrValue(link, "target"),
                href = link.attr(HREF),
                remote = href && href[0] !== "#" && this.options.serverNavigation;

            if (remote || rel === EXTERNAL || (typeof href === "undefined") || href === DUMMY_HREF) {
                return;
            }

            // Prevent iOS address bar progress display for in app navigation
            link.attr(HREF, DUMMY_HREF);
            setTimeout(function() { link.attr(HREF, href); });

            if (rel.match(WIDGET_RELS)) {
                kendo.widgetInstance($(href), ui).openFor(link);
                // if propagation is not stopped and actionsheet is opened from tabstrip,
                // the actionsheet is closed immediately.
                if (rel === "actionsheet") {
                    e.stopPropagation();
                }
            } else {
                if (target === "_top") {
                    pane = mobile.application.pane;
                }
                else if (target) {
                    pane = $("#" + target).data("kendoMobilePane");
                }

                pane.navigate(href, transition);
            }

            e.preventDefault();
        }
    });

    Pane.wrap = function(element) {
        var paneContainer = element.wrap('<div class="km-pane-wrapper km-root"><div><div data-role="view"></div></div></div>').parent().parent(),
            pane = new Pane(paneContainer);

        pane.navigate("");

        return pane;
    };
    ui.plugin(Pane);
})(window.kendo.jQuery);
