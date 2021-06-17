
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var tweets = [
    	{
    		Datetime: "2021-03-24 07:02:40+00:00",
    		"Tweet Id": 1374617643446063000,
    		Text: "You can now buy a Tesla with Bitcoin",
    		Retweets: 113773,
    		Likes: 896173,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-05-07 21:05:35+00:00",
    		"Tweet Id": 1390774840135766000,
    		Text: "Guest starring … https://t.co/buM3bTOWbX",
    		Retweets: 110604,
    		Likes: 771516,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-03-25 10:35:03+00:00",
    		"Tweet Id": 1375033483148451800,
    		Text: "If there’s ever a scandal about me, *please* call it Elongate",
    		Retweets: 56825,
    		Likes: 768939,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-05-06 19:26:59+00:00",
    		"Tweet Id": 1390387635961610200,
    		Text: "Make humanity a multiplanet species!",
    		Retweets: 64437,
    		Likes: 629812,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-03-27 03:34:31+00:00",
    		"Tweet Id": 1375652425814704000,
    		Text: "Check out our new crane https://t.co/PE4vL6uKcb",
    		Retweets: 49385,
    		Likes: 586839,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-03-14 14:17:57+00:00",
    		"Tweet Id": 1371103308425928700,
    		Text: "I love music. It makes my heart sing.",
    		Retweets: 57295,
    		Likes: 564956,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-04-17 01:37:48+00:00",
    		"Tweet Id": 1383233200885883000,
    		Text: "Everything to the moon!",
    		Retweets: 65683,
    		Likes: 560272,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-05-13 22:45:16+00:00",
    		"Tweet Id": 1392974251011895300,
    		Text: "Working with Doge devs to improve system transaction efficiency. Potentially promising.",
    		Retweets: 87379,
    		Likes: 553054,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-04-10 07:15:47+00:00",
    		"Tweet Id": 1380781539647053800,
    		Text: "… going to moon very soon",
    		Retweets: 45050,
    		Likes: 545898,
    		Username: "elonmusk"
    	},
    	{
    		Datetime: "2021-04-01 10:25:23+00:00",
    		"Tweet Id": 1377567762919293000,
    		Text: "SpaceX is going to put a literal Dogecoin on the literal moon",
    		Retweets: 52972,
    		Likes: 545353,
    		Username: "elonmusk"
    	}
    ];

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (18:1) {:else}
    function create_else_block(ctx) {
    	let ul;
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let each_value = tweets;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			h3 = element("h3");
    			h3.textContent = "Elon Musk's top 10 most liked tweets";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Select a tweet below for details!";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file, 19, 2, 499);
    			add_location(p, file, 20, 2, 547);
    			add_location(ul, file, 18, 1, 492);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, h3);
    			append_dev(ul, t1);
    			append_dev(ul, p);
    			append_dev(ul, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedTweets, tweets*/ 1) {
    				each_value = tweets;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:1) {#if selectedTweets}
    function create_if_block(ctx) {
    	let p0;
    	let a;
    	let t1;
    	let h1;
    	let t2;
    	let t3_value = /*selectedTweets*/ ctx[0].Text + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let t6_value = /*selectedTweets*/ ctx[0].Datetime + "";
    	let t6;
    	let t7;
    	let p2;
    	let t8;
    	let t9_value = /*selectedTweets*/ ctx[0].Likes + "";
    	let t9;
    	let t10;
    	let t11_value = /*selectedTweets*/ ctx[0].Retweets + "";
    	let t11;
    	let t12;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			a = element("a");
    			a.textContent = "Go back to list";
    			t1 = space();
    			h1 = element("h1");
    			t2 = text("He tweeted: ");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("The tweeted date and time is ");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			t8 = text("The post got *");
    			t9 = text(t9_value);
    			t10 = text("* number of likes,\n\t\tand *");
    			t11 = text(t11_value);
    			t12 = text("* number of retweets.");
    			attr_dev(a, "href", "#");
    			add_location(a, file, 12, 5, 178);
    			add_location(p0, file, 12, 2, 175);
    			attr_dev(h1, "class", "svelte-1tky8bj");
    			add_location(h1, file, 13, 2, 256);
    			add_location(p1, file, 14, 2, 302);
    			add_location(p2, file, 15, 2, 366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, a);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t8);
    			append_dev(p2, t9);
    			append_dev(p2, t10);
    			append_dev(p2, t11);
    			append_dev(p2, t12);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedTweets*/ 1 && t3_value !== (t3_value = /*selectedTweets*/ ctx[0].Text + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*selectedTweets*/ 1 && t6_value !== (t6_value = /*selectedTweets*/ ctx[0].Datetime + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*selectedTweets*/ 1 && t9_value !== (t9_value = /*selectedTweets*/ ctx[0].Likes + "")) set_data_dev(t9, t9_value);
    			if (dirty & /*selectedTweets*/ 1 && t11_value !== (t11_value = /*selectedTweets*/ ctx[0].Retweets + "")) set_data_dev(t11, t11_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(p2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:1) {#if selectedTweets}",
    		ctx
    	});

    	return block;
    }

    // (22:2) {#each tweets as tweet}
    function create_each_block(ctx) {
    	let li;
    	let t_value = /*tweet*/ ctx[3].Text + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[2](/*tweet*/ ctx[3]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file, 22, 2, 616);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(22:2) {#each tweets as tweet}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let t0;
    	let p;
    	let t1;
    	let a;
    	let t3;

    	function select_block_type(ctx, dirty) {
    		if (/*selectedTweets*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			t0 = space();
    			p = element("p");
    			t1 = text("Visit the ");
    			a = element("a");
    			a.textContent = "Svelte tutorial";
    			t3 = text(" to learn how to build Svelte apps.");
    			attr_dev(a, "href", "https://svelte.dev/tutorial");
    			add_location(a, file, 26, 14, 716);
    			add_location(p, file, 26, 1, 703);
    			attr_dev(main, "class", "svelte-1tky8bj");
    			add_location(main, file, 10, 0, 144);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_block.m(main, null);
    			append_dev(main, t0);
    			append_dev(main, p);
    			append_dev(p, t1);
    			append_dev(p, a);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(main, t0);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let selectedTweets;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(0, selectedTweets = null);
    	const click_handler_1 = tweet => $$invalidate(0, selectedTweets = tweet);
    	$$self.$capture_state = () => ({ tweets, selectedTweets });

    	$$self.$inject_state = $$props => {
    		if ("selectedTweets" in $$props) $$invalidate(0, selectedTweets = $$props.selectedTweets);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [selectedTweets, click_handler, click_handler_1];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'Kim'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
