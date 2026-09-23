// frontend/js/i18n.js
// AgriConnect Website-Wide Internationalization (i18n) System
// Supports: English (en), Telugu (te), Hindi (hi)

(function () {
  const LANG_KEY = 'agriconnect_lang';
  const SUPPORTED_LANGS = ['en', 'te', 'hi'];
  const DEFAULT_LANG = 'en';

  const TRANSLATIONS = {
    en: {
      // Header & Brand
      brand_title: 'AgriConnect',
      brand_tagline: 'No more waiting in line for your harvest.',
      brand_farmer_portal: 'Farmer Procurement Portal',
      brand_mandi_desk: 'Mandi Desk · APMC Yard',
      brand_admin_title: 'AgriConnect Admin',
      brand_admin_tagline: 'Procurement Operations & Mandi Control',
      theme_dark: 'Dark Mode',
      theme_light: 'Light Mode',
      nav_login: 'Login',
      nav_signup: 'Sign Up',
      nav_logout: 'Logout',
      nav_notifications: 'Notifications',
      nav_mark_all_read: 'Mark all read',
      nav_alerts_heading: 'Procurement & SMS Alerts',
      nav_loading_alerts: 'Loading alerts...',
      nav_mandi_directory: 'Mandi Directory',
      nav_mandi_rates: 'Mandi Rates',
      nav_farmer_portal_link: 'Farmer Portal',

      // Landing Hero & Features
      hero_title: 'Direct Mandi Access. <span>Zero Waiting.</span> Guaranteed Payouts.',
      hero_desc: 'Book procurement slots from your mobile phone, track your real-time queue position with live wait times, and receive automatic SMS updates at every step from weighing to direct bank transfer.',
      hero_feat_1_title: 'Live Queue Tracker',
      hero_feat_1_desc: 'Know exact wait times before arrival',
      hero_feat_2_title: 'Transparent Grading',
      hero_feat_2_desc: 'Live status from weighbridge to acceptance',
      hero_feat_3_title: 'Daily Mandi Ticker',
      hero_feat_3_desc: 'Real-time APMC benchmark prices',
      hero_welcome_title: 'Welcome to AgriConnect',
      hero_welcome_desc: "India's Smart Agricultural Procurement & Live Queue Infrastructure",
      meta_pan_india: 'Pan-India',
      meta_31_states: '31 States & UTs',
      meta_zero_waiting: 'Zero Waiting',
      meta_queue_tracker: 'Live Queue Tracker',
      meta_guaranteed: 'Guaranteed',
      meta_direct_payout: 'Direct Bank Payout',

      // Mandi Rates Section
      rates_title: "Today's Mandi Benchmark Rates",
      rates_subtitle: 'Live wholesale agricultural rates updated directly from regional APMC procurement centres.',
      rates_auto_refresh: 'Auto-refreshes in real-time',
      rates_search_placeholder: '🔍 Search crops (e.g. Wheat, Sugarcane, Chilli, Cotton, Turmeric)...',
      rates_showing_crops: 'Showing all 30 Mandi Crops',
      rates_loading: 'Loading live market prices...',
      rates_no_crops: 'No Crops Found',
      rates_no_crops_sub: 'No mandi benchmark rates matched your search. Clear search to view all crops.',

      // Mandi Directory Section
      mandi_dir_title: 'All Procurement Mandis Across India',
      mandi_dir_subtitle: 'Browse and search all authorized APMC procurement centres across 31 States & Union Territories. Select any mandi to book your arrival slot.',
      mandi_search_placeholder: '🔍 Search mandi by name, city, district, or address...',
      mandi_all_states: 'All States (Pan-India)',
      mandi_loading: 'Loading procurement mandis across India...',
      btn_book_slot_mandi: 'Book Slot at this Mandi →',
      label_capacity: 'Capacity',
      label_farmers_per_day: 'farmers/day',
      label_hours: 'Hours',
      label_mandi_benchmark_rate: 'Mandi Benchmark Rate / Quintal',
      label_prev: 'Prev',
      ticker_live_mandi: '🔴 LIVE MANDI',
      ticker_market_rates: 'Market Rates',
      ticker_price: 'Price',
      ticker_previous: 'Previous',
      ticker_updated: 'Updated',
      ticker_increase: 'Increase',
      ticker_decrease: 'Decrease',
      ticker_no_change: 'No Change',
      time_just_now: 'Just now',
      time_sec_ago: 's ago',
      time_min_ago: 'm ago',
      time_hour_ago: 'h ago',
      rates_showing_prefix: 'Showing',
      rates_of: 'of',
      rates_mandi_crops: 'Mandi Crops',

      // Role Selection & Auth Modals
      auth_modal_login_title: 'Login to AgriConnect',
      auth_modal_signup_title: 'Create AgriConnect Account',
      role_select_heading_login: 'Select Your Login Portal',
      role_select_heading_signup: 'Choose Registration Role',
      role_select_subheading_login: 'Choose whether you are logging in as a Farmer or Mandi APMC Desk',
      role_select_subheading_signup: 'Select your role to register a new Farmer account or APMC Mandi Centre',
      role_farmer_title: 'Farmer',
      role_farmer_desc: 'For farmers to book procurement slots, track live queues, and receive payouts.',
      role_farmer_btn_login: 'Login as Farmer →',
      role_farmer_btn_signup: 'Register as Farmer →',
      role_mandi_title: 'Mandi',
      role_mandi_desc: 'For APMC Mandi Officers, Weighbridge Operators, and Centre Administrators.',
      role_mandi_btn_login: 'Login as Mandi Staff →',
      role_mandi_btn_signup: 'Register Mandi & Admin →',
      back_btn: '← Back',
      footer_no_account: "Don't have an account?",
      footer_signup_here: 'Sign Up here',
      footer_have_account: 'Already have an account?',
      footer_login_here: 'Login here',

      // Auth Forms
      farmer_login_heading: '🌾 Farmer Secure Login',
      farmer_reg_heading: '🌾 Farmer Registration',
      mandi_login_heading: '🏢 Mandi Staff Login',
      mandi_reg_heading: '🏛️ Register Mandi Centre & Admin',
      label_farmer_phone: 'Farmer Registered Phone',
      placeholder_farmer_phone: 'e.g. 9876543210',
      label_password: 'Password',
      placeholder_password: 'Enter your password',
      btn_farmer_login: 'Farmer Secure Login →',
      demo_farmer_badge: 'Demo Farmer Account:',
      switch_to_farmer_reg: "Don't have a farmer account? Register as Farmer →",
      label_full_name: 'Full Name',
      placeholder_full_name: 'e.g. Ramesh Kumar Patil',
      label_phone_10: 'Phone Number (10 Digits) *',
      placeholder_phone_10: 'e.g. 9822001122',
      help_phone: 'Must be a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
      label_create_password: 'Create Password',
      placeholder_min_6: 'At least 6 characters',
      label_village: 'Village / Address',
      placeholder_village: 'e.g. Dindori, Nashik',
      label_aadhaar: 'Aadhaar Card Number (12 Digits) *',
      placeholder_aadhaar: 'e.g. 5421 8921 4412',
      help_aadhaar: 'Must consist of exactly 12 numeric digits.',
      label_crops_grown: 'Crops Grown (Select all that apply)',
      placeholder_custom_crop: 'Add custom crop not listed above',
      btn_add_crop: '+ Add',
      btn_complete_farmer_reg: 'Complete Farmer Registration →',
      switch_to_farmer_login: 'Already registered as a farmer? Farmer Login →',
      label_mandi_phone: 'Mandi Staff Official Mobile',
      placeholder_mandi_phone: 'e.g. 9999999999',
      help_mandi_staff: 'Authorized APMC Mandi Officers, Weighbridge Staff, & Admins.',
      label_staff_password: 'Staff Password',
      placeholder_staff_password: 'Enter password',
      btn_mandi_login: 'Mandi Staff Login →',
      demo_staff_badge: 'Pre-seeded Staff Account:',
      switch_to_mandi_reg: 'Need to register a new Mandi Centre? Register Mandi & Admin →',
      mandi_reg_intro: 'Register a new APMC Mandi Centre along with its primary Mandi Admin account.',
      label_mandi_name: 'Mandi / Centre Name *',
      placeholder_mandi_name: 'e.g. Nashik Main APMC Yard',
      label_district: 'District / City *',
      placeholder_district: 'e.g. Nashik',
      label_state: 'State *',
      placeholder_state: 'e.g. Maharashtra',
      label_location: 'Location / Address',
      placeholder_location: 'e.g. Market Yard, Panchavati',
      label_daily_capacity: 'Daily Capacity (Farmers/day)',
      label_crops_procured: 'Crops Procured',
      placeholder_crops_procured: 'e.g. Wheat, Tomato, Onion',
      label_primary_admin: 'Primary Mandi Admin Details',
      label_admin_fullname: 'Admin Full Name *',
      placeholder_admin_fullname: 'e.g. Rajesh Sharma',
      label_admin_phone: 'Official Mobile Number (10 Digits) *',
      label_admin_password: 'Create Admin Password *',
      btn_register_mandi: 'Register Mandi & Admin Account →',
      switch_to_mandi_login: 'Already registered as Mandi staff? Mandi Staff Login →',
      label_select_mandi_centre: 'Select Mandi / Procurement Centre * (114 Pan-India APMCs)',
      placeholder_search_114_mandis: '🔍 Search 114 mandis by name, district, state...',
      btn_change_mandi: 'Change Mandi',
      mandi_loading_list: 'Loading 114 Mandis...',
      mandi_mandis_found: 'Mandis found',
      legend_available: 'Available',
      legend_claimed: 'Already Claimed',
      badge_available: 'Available',
      badge_claimed: 'Already Registered',
      mandi_none_found: 'No mandis match your search filter.',
      mandi_error_claimed: 'This Mandi Centre is already registered by a Mandi Admin and cannot be claimed again.',
      mandi_error_select_required: 'Please select an available Mandi Centre from the list before registering.',

      // Password Hint & Forgot Password Recovery
      link_forgot_password: 'Forgot Password?',
      password_hint_title: 'Password Hint Reminder',
      password_hint_subtitle: 'Enter your registered mobile number to view your password hint',
      forgot_phone_label: 'Registered Mobile Number (10 Digits)',
      btn_get_hint: 'Get Password Hint →',
      label_password_hint: 'Password Hint (Optional)',
      placeholder_password_hint: 'e.g. Favorite tractor brand or village deity',
      help_password_hint: 'Add a hint that helps you remember your password. Do not enter your actual password.',
      your_password_hint_label: 'Your Password Hint:',
      hint_reminder_text: 'Use this hint to remember your password and return to the login page.',
      hint_recovery_info: 'Account Recovery Info',
      hint_not_found_neutral: 'If an account exists with this mobile number, your hint information will be displayed.',
      hint_helpline_note: 'If you did not configure a hint or cannot recall your password, please contact AgriConnect Mandi Support or your local APMC helpdesk for assistance.',
      btn_back_to_login: '← Back to Login',
      label_confirm_password: 'Confirm Password *',
      placeholder_confirm_password: 'Re-enter password',
      err_password_mismatch: 'Passwords do not match. Please re-enter.',
      err_hint_same_as_password: 'Password hint cannot be identical to your password. Please provide a reminder hint.',

      // Farmer Dashboard & Booking
      card_book_slot: 'Book a Procurement Slot',
      sub_instant_token: 'Instant Token Confirmation',
      label_select_state: 'Select State',
      label_filter_city: 'Filter City',
      placeholder_filter_city: 'Type city (e.g. Pune, Jaipur)...',
      label_centre_select: 'Procurement Centre (APMC / Mandi)',
      option_loading_centres: 'Loading centres...',
      label_appt_date: 'Appointment Date',
      label_select_slot: 'Select Hourly Arrival Slot',
      slots_select_centre_first: 'Select a centre to view slots.',
      label_crop_to_sell: 'Crop to Sell',
      choose_crop_placeholder: '-- Choose Crop to Sell (30 Crops Available) --',
      label_quantity_est: 'Estimated Harvest Quantity (in Kilograms)',
      placeholder_qty: 'e.g. 500',
      help_weighed_at_mandi: 'Final price is weighed & calculated at the mandi counter.',
      btn_confirm_booking: 'Confirm & Book Slot →',
      card_my_crops: 'My Registered Crops',
      text_crops_highlighted: 'Rates for your registered crops are automatically highlighted in the live mandi ticker above.',
      card_how_it_works: 'How AgriConnect Queue Works',
      step_1: 'Book your slot before loading your vehicle.',
      step_2: 'Monitor your queue position and live estimated wait time right here.',
      step_3: 'You will receive automated notifications when it is your turn to be served.',
      step_4: 'Arrive at the counter, get your harvest weighed and graded transparently.',
      step_5: 'Payment status updates directly to your dashboard upon processing.',
      card_my_bookings: 'My Procurement Bookings',
      sub_live_status: 'Live status from booked to paid',
      th_date_time: 'Date & Time',
      th_centre: 'Centre',
      th_crop_token: 'Crop & Token',
      th_quantity: 'Quantity',
      th_booking_status: 'Booking Status',
      th_procurement: 'Procurement',
      th_payment: 'Payment',
      th_final_amount: 'Final Amount',
      th_action_receipt: 'Action / Receipt',
      btn_receipt: 'Receipt',
      no_bookings_yet: 'No bookings found yet. Book your first procurement slot above!',
      loading_bookings: 'Loading your bookings...',

      // Live Queue Tracker
      queue_tracker_title: 'Live Procurement Queue Tracker',
      queue_your_turn: 'IT IS YOUR TURN!',
      queue_your_token: 'Your Token',
      queue_now_serving: 'Now Serving',
      queue_pos_in_line: 'Position in Line',
      queue_est_wait: 'Estimated Wait',
      queue_now: 'Now!',
      queue_mins: 'mins',
      queue_no_active: 'No Active Queue Today',
      queue_no_active_desc: 'Select a procurement centre and book a slot below to receive your real-time queue position token.',
      queue_upcoming_confirmed: 'Upcoming Booking Confirmed',
      queue_live_tracker_day_of_visit: 'Live tracker activates on day of visit',
      queue_proceed_counter: 'Please proceed to the procurement desk immediately with your crop harvest!',
      queue_you_are_next: 'You are next! Please arrive near the counter right now.',
      queue_token_label: 'Queue Token',
      auto_updates_realtime: 'Auto-updates in real-time',

      // Mandi Desk Page & Modals
      mandi_admin_controls: 'Mandi Administration Controls',
      mandi_admin_desc: 'Manage staff accounts, edit hourly slot capacity, and oversee procurement operations.',
      btn_staff_directory: 'Mandi Staff Directory',
      btn_add_member: 'Add Mandi Member',
      live_slot_grid: 'Live Slot Grid',
      btn_refresh: 'Refresh',
      btn_register_walkin: 'Register Walk-in (Offline) Farmer',
      hourly_ops_board: 'Hourly Operations Board',
      legend_open: 'Open (Unbooked)',
      legend_partial: 'Partial (1 Walk-in)',
      legend_full: 'Full (Maxed)',
      legend_closed: 'Closed (Past Cutoff)',
      bookings_for_slot: 'Bookings for Slot',
      select_booking_workflow: 'Select any booking to open the Procurement & Payment Workflow.',
      th_queue_hash: 'Queue #',
      th_farmer_name_phone: 'Farmer Name & Phone',
      th_channel: 'Channel',
      th_approval: 'Approval',
      th_proc_status: 'Procurement Status',
      th_action: 'Action',
      btn_call_now: 'Call Now',
      modal_walkin_title: 'Add Walk-in (Offline) Booking',
      walkin_rule_notice: 'Strict Rule: Walk-in registrations are capped at max 2 per slot. 3rd attempt will be blocked.',
      label_farmer_name: 'Farmer Name *',
      label_crop_name: 'Crop Name *',
      placeholder_walkin_crop: 'e.g. Tomato (Hybrid), Wheat',
      label_est_qty_kg: 'Estimated Quantity (kg) *',
      label_select_walkin_slot: 'Select Slot for Walk-in *',
      btn_cancel: 'Cancel',
      btn_save_walkin: 'Save Walk-in Booking →',
      modal_wf_title: 'Procurement & Settlement Workflow',
      wf_sec_1: '1. Farmer & Booking Specifications',
      wf_sec_2: '2. Physical Inspection & Quality Grading',
      wf_sec_3: '3. Payment Mode & Settlement',
      wf_sec_4: '4. Final Amount & Verification',
      label_actual_qty: 'Actual Weighed Quantity (kg) *',
      label_quality_grade: 'Quality Grade *',
      label_agreed_price: 'Agreed Price per Unit (₹ / kg) *',
      label_payment_mode: 'Payment Mode *',
      label_payment_status: 'Payment Status *',
      label_txn_ref: 'Transaction Reference / UTR Number *',
      label_auto_calc: 'Auto-calculated (Qty × Rate):',
      label_final_payout: 'Final Payout Amount:',
      label_final_override: 'Final Amount Override (₹)',
      help_override: 'Edit only if manual adjustment is needed for moisture, cleaning, or labor charges.',
      btn_accept_generate_receipt: 'Accept & Generate Official Receipt →',
      modal_edit_slot_title: 'Edit Slot Configuration',
      label_start_time: 'Start Time (HH:MM:SS)',
      label_end_time: 'End Time (HH:MM:SS)',
      label_max_capacity: 'Max Bookings Capacity *',
      btn_save_changes: 'Save Changes',
      modal_add_member_title: 'Add Mandi Member',
      label_assign_role: 'Assign Role',
      btn_create_staff: 'Create Staff Account',
      btn_close: 'Close',
      btn_print: 'Print',
      btn_download_png: 'Download PNG',
      receipt_modal_title: 'Official Procurement Receipt',
      receipt_badge_gemini: 'Gemini AI Generated Receipt',
      receipt_badge_verified: 'Verified Mandi Receipt (Canvas)',

      // Admin Portal
      admin_control_desk: 'Real-time Queue Desk',
      admin_now_serving: 'Now Serving:',
      admin_btn_call_next: '📢 Call Next Farmer',
      admin_call_next_sub: 'Advancing queue alerts next 2 farmers via SMS',
      admin_today_queue: "Today's Procurement Queue",
      admin_update_prompt: 'Click "Update" to grade harvest & process payout',
      admin_analytics: 'Procurement Centre Analytics & Congestion',
      metric_total_bookings: 'Total Bookings Today',
      metric_farmers_served: 'Farmers Served',
      metric_procured_vol: 'Total Procured Volume',
      metric_total_payout: 'Total Payout Disbursed',
      metric_avg_wait: 'Average Wait Time',
      chart_hourly_congestion: 'Hourly Farmer Arrival & Congestion',
      chart_crop_share: 'Procurement Share by Crop',
      admin_manage_rates: 'Manage Daily Mandi Crop Rates',
      admin_rates_desc: 'Price edits are broadcasted instantly to the public live ticker and farmer dashboard via WebSockets.',
      th_crop: 'Crop',
      th_current_rate: 'Current (₹/q)',
      th_prev_rate: 'Previous (₹/q)',
      th_trend: 'Trend',
      th_update_price: 'Update Price',
      admin_add_crop_title: '➕ Add New Crop Rate',
      label_initial_rate: 'Initial Rate (₹ per Quintal)',
      btn_add_to_ticker: 'Add to Mandi Ticker →',
      modal_update_payout: 'Update Procurement & Payout',
      label_proc_quality_status: 'Procurement Quality Status',
      label_final_weighed_qty: 'Final Weighed Quantity (kg)',
      label_pay_disbursal_status: 'Payment Disbursement Status',
      label_final_settlement_amt: 'Final Settlement Amount (₹ INR)',
      btn_save_notify_farmer: 'Save & Notify Farmer',

      // Dynamic Status Badges & Channels
      status_booked: 'Booked',
      status_in_queue: 'In Queue',
      status_completed: 'Completed',
      status_cancelled: 'Cancelled',
      status_pending: 'Pending',
      status_weighed: 'Weighed',
      status_graded: 'Graded',
      status_accepted: 'Accepted',
      status_rejected: 'Rejected',
      status_processing: 'Processing',
      status_paid: 'Paid',
      status_approved: 'Approved',
      channel_online: 'Online Booking',
      channel_offline: 'Walk-in (Offline)',
      grade_a: 'Grade A (Premium Quality)',
      grade_b: 'Grade B (Standard Market)',
      grade_c: 'Grade C (Fair / Commercial)',
      grade_rejected: 'Rejected (Substandard)',
      pay_cash: 'Cash',
      pay_upi: 'UPI (QR / PhonePe / GPay)',
      pay_bank: 'Direct Bank Transfer (NEFT / RTGS)',

      // Crop Categories & Form Labels
      crop_cat_cereals: '🌾 Cereals & Grains',
      crop_cat_pulses: '🌿 Pulses & Legumes',
      crop_cat_oilseeds: '🌱 Oilseeds',
      crop_cat_cash: '🎋 Cash Crops & Commercial Fibres',
      crop_cat_veg_fruits: '🍅 Vegetables & Fruits',
      crop_cat_spices: '🧂 Spices & Condiments',
      queue_crop_label: 'Crop',

      // Footer
      footer_rights: 'AgriConnect — Smart Agricultural Procurement & Live Queue Infrastructure.',
      footer_support_farmers: 'Supporting farmers with transparent procurement workflows and fair market prices.',
      footer_farmer_dashboard: 'AgriConnect — Farmer Dashboard.',
      footer_need_support: 'Need support with your slot or queue token? Contact mandi support.',
      footer_mandi_desk: 'AgriConnect Mandi Operations Desk • National APMC Network'
    },

    te: {
      // Header & Brand
      brand_title: 'అగ్రికనెక్ట్',
      brand_tagline: 'మీ పంట విక్రయానికి ఇక లైన్లలో నిలబడాల్సిన అవసరం లేదు.',
      brand_farmer_portal: 'రైతు సేకరణ పోర్టల్',
      brand_mandi_desk: 'మండి డెస్క్ · APMC యార్డ్',
      brand_admin_title: 'అగ్రికనెక్ట్ అడ్మిన్',
      brand_admin_tagline: 'సేకరణ నిర్వహణ మరియు మండి నియంత్రణ',
      theme_dark: 'డార్క్ మోడ్',
      theme_light: 'లైట్ మోడ్',
      nav_login: 'లాగిన్',
      nav_signup: 'సైన్ అప్',
      nav_logout: 'లాగౌట్',
      nav_notifications: 'నోటిఫికేషన్లు',
      nav_mark_all_read: 'అన్నీ చదివినట్లు గుర్తించు',
      nav_alerts_heading: 'సేకరణ మరియు SMS హెచ్చరికలు',
      nav_loading_alerts: 'హెచ్చరికలు లోడ్ అవుతున్నాయి...',
      nav_mandi_directory: 'మండి డైరెక్టరీ',
      nav_mandi_rates: 'మండి ధరలు',
      nav_farmer_portal_link: 'రైతు పోర్టల్',

      // Landing Hero & Features
      hero_title: 'నేరుగా మండి ప్రవేశం. <span>జీరో వెయిటింగ్.</span> హామీతో కూడిన చెల్లింపులు.',
      hero_desc: 'మీ మొబైల్ ఫోన్ నుండి సేకరణ స్లాట్‌లను బుక్ చేసుకోండి, ప్రత్యక్ష నిరీక్షణ సమయాలతో మీ రియల్ టైమ్ క్యూ స్థానాన్ని ట్రాక్ చేయండి మరియు తూకం నుండి నేరుగా బ్యాంక్ బదిలీ వరకు ప్రతి దశలో ఆటోమేటిక్ SMS అప్‌డేట్‌లను పొందండి.',
      hero_feat_1_title: 'ప్రత్యక్ష క్యూ ట్రాకర్',
      hero_feat_1_desc: 'చేరడానికి ముందే ఖచ్చితమైన నిరీక్షణ సమయం తెలుసుకోండి',
      hero_feat_2_title: 'పారదర్శక గ్రేడింగ్',
      hero_feat_2_desc: 'వేబ్రిడ్జ్ నుండి ఆమోదం వరకు ప్రత్యక్ష స్థితి',
      hero_feat_3_title: 'రోజువారీ మండి టిక్కర్',
      hero_feat_3_desc: 'రియల్ టైమ్ APMC బెంచ్‌మార్క్ ధరలు',
      hero_welcome_title: 'అగ్రికనెక్ట్‌కు స్వాగతం',
      hero_welcome_desc: 'భారతదేశపు స్మార్ట్ వ్యవసాయ సేకరణ & ప్రత్యక్ష క్యూ మౌలిక సదుపాయాలు',
      meta_pan_india: 'భారతదేశవ్యాప్తంగా',
      meta_31_states: '31 రాష్ట్రాలు & కేంద్రపాలిత ప్రాంతాలు',
      meta_zero_waiting: 'జీరో వెయిటింగ్',
      meta_queue_tracker: 'ప్రత్యక్ష క్యూ ట్రాకర్',
      meta_guaranteed: 'హామీ చెల్లింపు',
      meta_direct_payout: 'నేరుగా బ్యాంక్ బదిలీ',

      // Mandi Rates Section
      rates_title: 'నేటి మండి బెంచ్‌మార్క్ ధరలు',
      rates_subtitle: 'ప్రాంతీయ APMC సేకరణ కేంద్రాల నుండి నేరుగా నవీకరించబడిన ప్రత్యక్ష హోల్‌సేల్ వ్యవసాయ ధరలు.',
      rates_auto_refresh: 'రియల్ టైమ్‌లో ఆటో-రిఫ్రెష్ అవుతుంది',
      rates_search_placeholder: '🔍 పంటలను శోధించండి (ఉదా. గోధుమలు, చెరకు, మిరప, పత్తి, పసుపు)...',
      rates_showing_crops: 'మొత్తం 30 మండి పంటలు చూపబడుతున్నాయి',
      rates_loading: 'ప్రత్యక్ష మార్కెట్ ధరలు లోడ్ అవుతున్నాయి...',
      rates_no_crops: 'పంటలు కనుగొనబడలేదు',
      rates_no_crops_sub: 'శోధించిన పంటలు కనుగొనబడలేదు. అన్ని పంటలను చూడటానికి శోధనను తొలగించండి.',

      // Mandi Directory Section
      mandi_dir_title: 'భారతదేశవ్యాప్తంగా అన్ని సేకరణ మండీలు',
      mandi_dir_subtitle: '31 రాష్ట్రాలు & కేంద్రపాలిత ప్రాంతాలలో అధికారిక APMC సేకరణ కేంద్రాలను బ్రౌజ్ చేయండి. మీ రాక స్లాట్‌ను బుక్ చేసుకోవడానికి ఏదైనా మండిని ఎంచుకోండి.',
      mandi_search_placeholder: '🔍 పేరు, నగరం, జిల్లా లేదా చిరునామా ద్వారా మండిని శోధించండి...',
      mandi_all_states: 'అన్ని రాష్ట్రాలు (పాన్-ఇండియా)',
      mandi_loading: 'భారతదేశవ్యాప్తంగా సేకరణ మండీలు లోడ్ అవుతున్నాయి...',
      btn_book_slot_mandi: 'ఈ మండి వద్ద స్లాట్ బుక్ చేయండి →',
      label_capacity: 'సామర్థ్యం',
      label_farmers_per_day: 'రైతులు/రోజు',
      label_hours: 'సమయం',
      label_mandi_benchmark_rate: 'మండి బెంచ్‌మార్క్ ధర / క్వింటాల్',
      label_prev: 'మునుపటి',
      ticker_live_mandi: '🔴 లైవ్ మండి',
      ticker_market_rates: 'మార్కెట్ ధరలు',
      ticker_price: 'ధర',
      ticker_previous: 'మునుపటి',
      ticker_updated: 'నవీకరించబడింది',
      ticker_increase: 'పెరుగుదల',
      ticker_decrease: 'తగ్గుదల',
      ticker_no_change: 'మార్పు లేదు',
      time_just_now: 'ఇప్పుడే',
      time_sec_ago: 'సెకన్ల క్రితం',
      time_min_ago: 'నిమిషాల క్రితం',
      time_hour_ago: 'గంటల క్రితం',
      rates_showing_prefix: 'చూపిస్తున్నది',
      rates_of: 'నుండి',
      rates_mandi_crops: 'మండి పంటలు',

      // Role Selection & Auth Modals
      auth_modal_login_title: 'అగ్రికనెక్ట్‌లోకి లాగిన్ అవ్వండి',
      auth_modal_signup_title: 'అగ్రికనెక్ట్ ఖాతాను సృష్టించండి',
      role_select_heading_login: 'మీ లాగిన్ పోర్టల్‌ను ఎంచుకోండి',
      role_select_heading_signup: 'రిజిస్ట్రేషన్ పాత్రను ఎంచుకోండి',
      role_select_subheading_login: 'మీరు రైతుగా లేదా మండి APMC డెస్క్‌గా లాగిన్ అవుతున్నారా అనేది ఎంచుకోండి',
      role_select_subheading_signup: 'కొత్త రైతు ఖాతా లేదా APMC మండి కేంద్రాన్ని నమోదు చేయడానికి మీ పాత్రను ఎంచుకోండి',
      role_farmer_title: 'రైతు',
      role_farmer_desc: 'రైతులు సేకరణ స్లాట్‌లను బుక్ చేసుకోవడానికి, ప్రత్యక్ష క్యూలను ట్రాక్ చేయడానికి మరియు చెల్లింపులను స్వీకరించడానికి.',
      role_farmer_btn_login: 'రైతుగా లాగిన్ అవ్వండి →',
      role_farmer_btn_signup: 'రైతుగా నమోదు చేసుకోండి →',
      role_mandi_title: 'మండి',
      role_mandi_desc: 'APMC మండి అధికారులు, వేబ్రిడ్జ్ ఆపరేటర్లు మరియు కేంద్ర నిర్వాహకుల కోసం.',
      role_mandi_btn_login: 'మండి సిబ్బందిగా లాగిన్ అవ్వండి →',
      role_mandi_btn_signup: 'మండి & అడ్మిన్‌ను నమోదు చేయండి →',
      back_btn: '← వెనుకకు',
      footer_no_account: 'ఖాతా లేదా?',
      footer_signup_here: 'ఇక్కడ సైన్ అప్ చేయండి',
      footer_have_account: 'ఇప్పటికే ఖాతా ఉందా?',
      footer_login_here: 'ఇక్కడ లాగిన్ అవ్వండి',

      // Auth Forms
      farmer_login_heading: '🌾 రైతు సురక్షిత లాగిన్',
      farmer_reg_heading: '🌾 రైతు నమోదు',
      mandi_login_heading: '🏢 మండి సిబ్బంది లాగిన్',
      mandi_reg_heading: '🏛️ మండి కేంద్రం & అడ్మిన్ నమోదు',
      label_farmer_phone: 'రైతు నమోదిత ఫోన్ నంబర్',
      placeholder_farmer_phone: 'ఉదా. 9876543210',
      label_password: 'పాస్‌వర్డ్',
      placeholder_password: 'మీ పాస్‌వర్డ్ నమోదు చేయండి',
      btn_farmer_login: 'రైతు సురక్షిత లాగిన్ →',
      demo_farmer_badge: 'డెమో రైతు ఖాతా:',
      switch_to_farmer_reg: 'రైతు ఖాతా లేదా? రైతుగా నమోదు చేసుకోండి →',
      label_full_name: 'పూర్తి పేరు',
      placeholder_full_name: 'ఉదా. రమేష్ కుమార్ పాటిల్',
      label_phone_10: 'ఫోన్ నంబర్ (10 అంకెలు) *',
      placeholder_phone_10: 'ఉదా. 9822001122',
      help_phone: '6, 7, 8 లేదా 9తో ప్రారంభమయ్యే 10 అంకెల మొబైల్ నంబర్ అయి ఉండాలి.',
      label_create_password: 'పాస్‌వర్డ్‌ను సృష్టించండి',
      placeholder_min_6: 'కనీసం 6 అక్షరాలు',
      label_village: 'గ్రామం / చిరునామా',
      placeholder_village: 'ఉదా. దిండోరి, నాసిక్',
      label_aadhaar: 'ఆధార్ కార్డు సంఖ్య (12 అంకెలు) *',
      placeholder_aadhaar: 'ఉదా. 5421 8921 4412',
      help_aadhaar: 'ఖచ్చితంగా 12 సంఖ్యా అంకెలు ఉండాలి.',
      label_crops_grown: 'పండించే పంటలు (వర్తించేవన్నీ ఎంచుకోండి)',
      placeholder_custom_crop: 'పై జాబితాలో లేని పంటను జోడించండి',
      btn_add_crop: '+ జోడించు',
      btn_complete_farmer_reg: 'రైతు నమోదును పూర్తి చేయండి →',
      switch_to_farmer_login: 'ఇప్పటికే రైతుగా నమోదై ఉన్నారా? రైతు లాగిన్ →',
      label_mandi_phone: 'మండి సిబ్బంది అధికారిక మొబైల్',
      placeholder_mandi_phone: 'ఉదా. 9999999999',
      help_mandi_staff: 'అధికారిక APMC మండి అధికారులు, వేబ్రిడ్జ్ సిబ్బంది & అడ్మిన్లు.',
      label_staff_password: 'సిబ్బంది పాస్‌వర్డ్',
      placeholder_staff_password: 'పాస్‌వర్డ్ నమోదు చేయండి',
      btn_mandi_login: 'మండి సిబ్బంది లాగిన్ →',
      demo_staff_badge: 'డెమో సిబ్బంది ఖాతా:',
      switch_to_mandi_reg: 'కొత్త మండి కేంద్రాన్ని నమోదు చేయాలా? మండి & అడ్మిన్‌ను నమోదు చేయండి →',
      mandi_reg_intro: 'కొత్త APMC మండి కేంద్రాన్ని మరియు దాని ప్రధాన మండి అడ్మిన్ ఖాతాను నమోదు చేయండి.',
      label_mandi_name: 'మండి / కేంద్రం పేరు *',
      placeholder_mandi_name: 'ఉదా. నాసిక్ మెయిన్ APMC యార్డ్',
      label_district: 'జిల్లా / నగరం *',
      placeholder_district: 'ఉదా. నాసిక్',
      label_state: 'రాష్ట్రం *',
      placeholder_state: 'ఉదా. మహారాష్ట్ర',
      label_location: 'స్థానం / చిరునామా',
      placeholder_location: 'ఉదా. మార్కెట్ యార్డ్, పంచవటి',
      label_daily_capacity: 'రోజువారీ సామర్థ్యం (రైతులు/రోజు)',
      label_crops_procured: 'సేకరించే పంటలు',
      placeholder_crops_procured: 'ఉదా. గోధుమలు, టమోటా, ఉల్లిపాయ',
      label_primary_admin: 'ప్రధాన మండి అడ్మిన్ వివరాలు',
      label_admin_fullname: 'అడ్మిన్ పూర్తి పేరు *',
      placeholder_admin_fullname: 'ఉదా. రాజేష్ శర్మ',
      label_admin_phone: 'అధికారిక మొబైల్ సంఖ్య (10 అంకెలు) *',
      label_admin_password: 'అడ్మిన్ పాస్‌వర్డ్‌ను సృష్టించండి *',
      btn_register_mandi: 'మండి & అడ్మిన్ ఖాతాను నమోదు చేయండి →',
      switch_to_mandi_login: 'ఇప్పటికే మండి సిబ్బందిగా నమోదై ఉన్నారా? మండి సిబ్బంది లాగిన్ →',
      label_select_mandi_centre: 'మండి / సేకరణ కేంద్రాన్ని ఎంచుకోండి * (114 పాన్-ఇండియా APMCలు)',
      placeholder_search_114_mandis: '🔍 పేరు, జిల్లా, రాష్ట్రం ద్వారా 114 మండీలను శోధించండి...',
      btn_change_mandi: 'మండిని మార్చండి',
      mandi_loading_list: '114 మండీలు లోడ్ అవుతున్నాయి...',
      mandi_mandis_found: 'మండీలు కనుగొనబడ్డాయి',
      legend_available: 'అందుబాటులో ఉంది',
      legend_claimed: 'ఇప్పటికే క్లెయిమ్ చేయబడింది',
      badge_available: 'అందుబాటులో ఉంది',
      badge_claimed: 'ఇప్పటికే నమోదు చేయబడింది',
      mandi_none_found: 'మీ శోధనకు సరిపోయే మండీలు కనుగొనబడలేదు.',
      mandi_error_claimed: 'ఈ మండి కేంద్రం ఇప్పటికే ఒక మండి అడ్మిన్ ద్వారా నమోదు చేయబడింది మరియు మళ్లీ క్లెయిమ్ చేయబడదు.',
      mandi_error_select_required: 'నమోదు చేయడానికి ముందు దయచేసి జాబితా నుండి అందుబాటులో ఉన్న మండి కేంద్రాన్ని ఎంచుకోండి.',

      // Password Hint & Forgot Password Recovery
      link_forgot_password: 'పాస్‌వర్డ్ మర్చిపోయారా?',
      password_hint_title: 'పాస్‌వర్డ్ సూచన (హింట్) రిమైండర్',
      password_hint_subtitle: 'మీ పాస్‌వర్డ్ సూచనను చూడటానికి మీ నమోదిత మొబైల్ నంబర్‌ను నమోదు చేయండి',
      forgot_phone_label: 'నమోదిత మొబైల్ నంబర్ (10 అంకెలు)',
      btn_get_hint: 'పాస్‌వర్డ్ సూచనను పొందండి →',
      label_password_hint: 'పాస్‌వర్డ్ సూచన / హింట్ (ఐచ్ఛికం)',
      placeholder_password_hint: 'ఉదా. ఇష్టమైన ట్రాక్టర్ బ్రాండ్ లేదా ఊరి దేవుడు',
      help_password_hint: 'మీ పాస్‌వర్డ్‌ను గుర్తుంచుకోవడానికి సహాయపడే ఒక సూచనను జోడించండి. మీ అసలు పాస్‌వర్డ్‌ను నమోదు చేయవద్దు.',
      your_password_hint_label: 'మీ పాస్‌వర్డ్ సూచన:',
      hint_reminder_text: 'మీ పాస్‌వర్డ్‌ను గుర్తుంచుకోవడానికి ఈ సూచనను ఉపయోగించండి మరియు లాగిన్ పేజీకి తిరిగి వెళ్లండి.',
      hint_recovery_info: 'ఖాతా పునరుద్ధరణ సమాచారం',
      hint_not_found_neutral: 'ఈ మొబైల్ నంబర్‌తో ఖాతా ఉంటే, మీ సూచన సమాచారం ప్రదర్శించబడుతుంది.',
      hint_helpline_note: 'మీరు సూచనను కాన్ఫిగర్ చేయకపోతే లేదా మీ పాస్‌వర్డ్‌ను గుర్తు చేసుకోలేకపోతే, దయచేసి సహాయం కోసం అగ్రికనెక్ట్ మండి మద్దతు లేదా మీ స్థానిక APMC హెల్ప్‌డెస్క్‌ని సంప్రదించండి.',
      btn_back_to_login: '← తిరిగి లాగిన్‌కు వెళ్లండి',
      label_confirm_password: 'పాస్‌వర్డ్‌ను నిర్ధారించండి *',
      placeholder_confirm_password: 'పాస్‌వర్డ్‌ను మళ్లీ నమోదు చేయండి',
      err_password_mismatch: 'పాస్‌వర్డ్‌లు సరిపోలడం లేదు. దయచేసి మళ్లీ నమోదు చేయండి.',
      err_hint_same_as_password: 'పాస్‌వర్డ్ సూచన మీ అసలు పాస్‌వర్డ్‌తో సమానంగా ఉండకూడదు. దయచేసి రిమైండర్ సూచనను నమోదు చేయండి.',

      // Farmer Dashboard & Booking
      card_book_slot: 'సేకరణ స్లాట్‌ను బుక్ చేయండి',
      sub_instant_token: 'తక్షణ టోకెన్ నిర్ధారణ',
      label_select_state: 'రాష్ట్రం ఎంచుకోండి',
      label_filter_city: 'నగరం ఫిల్టర్ చేయండి',
      placeholder_filter_city: 'నగరం టైప్ చేయండి (ఉదా. పూణే, జైపూర్)...',
      label_centre_select: 'సేకరణ కేంద్రం (APMC / మండి)',
      option_loading_centres: 'కేంద్రాలు లోడ్ అవుతున్నాయి...',
      label_appt_date: 'అపాయింట్‌మెంట్ తేదీ',
      label_select_slot: 'గంటవారీ రాక స్లాట్‌ను ఎంచుకోండి',
      slots_select_centre_first: 'స్లాట్‌లను వీక్షించడానికి కేంద్రాన్ని ఎంచుకోండి.',
      label_crop_to_sell: 'విక్రయించాల్సిన పంట',
      choose_crop_placeholder: '-- విక్రయించాల్సిన పంటను ఎంచుకోండి (30 పంటలు అందుబాటులో ఉన్నాయి) --',
      label_quantity_est: 'అంచనా వేసిన పంట పరిమాణం (కిలోగ్రాములలో)',
      placeholder_qty: 'ఉదా. 500',
      help_weighed_at_mandi: 'తుది ధర మండి కౌంటర్ వద్ద తూకం వేసి లెక్కించబడుతుంది.',
      btn_confirm_booking: 'నిర్ధారించి స్లాట్ బుక్ చేయండి →',
      card_my_crops: 'నా నమోదిత పంటలు',
      text_crops_highlighted: 'మీ నమోదిత పంటల ధరలు పైన ఉన్న ప్రత్యక్ష మండి టిక్కర్‌లో స్వయంచాలకంగా హైలైట్ చేయబడతాయి.',
      card_how_it_works: 'అగ్రికనెక్ట్ క్యూ ఎలా పనిచేస్తుంది',
      step_1: 'మీ వాహనంలో సరుకు లోడ్ చేయడానికి ముందే మీ స్లాట్‌ను బుక్ చేసుకోండి.',
      step_2: 'మీ క్యూ స్థానం మరియు ప్రత్యక్ష అంచనా వేసిన నిరీక్షణ సమయాన్ని ఇక్కడే పర్యవేక్షించండి.',
      step_3: 'మీ వంతు వచ్చినప్పుడు మీకు ఆటోమేటెడ్ నోటిఫికేషన్‌లు అందుతాయి.',
      step_4: 'కౌంటర్ వద్దకు చేరుకోండి, మీ పంటను పారదర్శకంగా తూకం వేయించి గ్రేడింగ్ పొందండి.',
      step_5: 'చెల్లింపు పూర్తయిన వెంటనే స్థితి నేరుగా మీ డాష్‌బోర్డ్‌లో అప్‌డేట్ అవుతుంది.',
      card_my_bookings: 'నా సేకరణ బుకింగ్‌లు',
      sub_live_status: 'బుక్ అయినప్పటి నుండి చెల్లింపు వరకు ప్రత్యక్ష స్థితి',
      th_date_time: 'తేదీ & సమయం',
      th_centre: 'కేంద్రం',
      th_crop_token: 'పంట & టోకెన్',
      th_quantity: 'పరిమాణం',
      th_booking_status: 'బుకింగ్ స్థితి',
      th_procurement: 'సేకరణ',
      th_payment: 'చెల్లింపు',
      th_final_amount: 'తుది మొత్తం',
      th_action_receipt: 'చర్య / రసీదు',
      btn_receipt: 'రసీదు',
      no_bookings_yet: 'ఇంకా ఎలాంటి బుకింగ్‌లు కనుగొనబడలేదు. పైన మీ మొదటి సేకరణ స్లాట్‌ను బుక్ చేసుకోండి!',
      loading_bookings: 'మీ బుకింగ్‌లు లోడ్ అవుతున్నాయి...',

      // Live Queue Tracker
      queue_tracker_title: 'ప్రత్యక్ష సేకరణ క్యూ ట్రాకర్',
      queue_your_turn: 'ఇది మీ వంతు!',
      queue_your_token: 'మీ టోకెన్',
      queue_now_serving: 'ఇప్పుడు సేవ పొందుతున్నది',
      queue_pos_in_line: 'క్యూలో స్థానం',
      queue_est_wait: 'అంచనా నిరీక్షణ',
      queue_now: 'ఇప్పుడే!',
      queue_mins: 'నిమిషాలు',
      queue_no_active: 'ఈ రోజు క్రియాశీల క్యూ ఏదీ లేదు',
      queue_no_active_desc: 'మీ రియల్ టైమ్ క్యూ పొజిషన్ టోకెన్‌ను స్వీకరించడానికి దిగువన ఒక సేకరణ కేంద్రాన్ని ఎంచుకుని స్లాట్‌ను బుక్ చేసుకోండి.',
      queue_upcoming_confirmed: 'రాబోయే బుకింగ్ నిర్ధారించబడింది',
      queue_live_tracker_day_of_visit: 'సందర్శన రోజున లైవ్ ట్రాకర్ సక్రియం అవుతుంది',
      queue_proceed_counter: 'దయచేసి మీ పంటతో వెంటనే సేకరణ డెస్క్‌కు వెళ్లండి!',
      queue_you_are_next: 'తదుపరి మీరే! దయచేసి వెంటనే కౌంటర్ సమీపానికి చేరుకోండి.',
      queue_token_label: 'క్యూ టోకెన్',
      auto_updates_realtime: 'రియల్ టైమ్‌లో స్వయంచాలకంగా అప్‌డేట్ అవుతుంది',

      // Mandi Desk Page & Modals
      mandi_admin_controls: 'మండి నిర్వహణ నియంత్రణలు',
      mandi_admin_desc: 'సిబ్బంది ఖాతాలను నిర్వహించండి, గంటలవారీ స్లాట్ సామర్థ్యాన్ని సవరించండి మరియు సేకరణ కార్యకలాపాలను పర్యవేక్షించండి.',
      btn_staff_directory: 'మండి సిబ్బంది డైరెక్టరీ',
      btn_add_member: 'మండి సభ్యుడిని జోడించండి',
      live_slot_grid: 'ప్రత్యక్ష స్లాట్ గ్రిడ్',
      btn_refresh: 'రిఫ్రెష్',
      btn_register_walkin: 'వాక్-ఇన్ (ఆఫ్‌లైన్) రైతు నమోదు',
      hourly_ops_board: 'గంటవారీ కార్యకలాపాల బోర్డు',
      legend_open: 'ఓపెన్ (బుక్ కాలేదు)',
      legend_partial: 'పాక్షికం (1 వాక్-ఇన్)',
      legend_full: 'పూర్తి (గరిష్టం)',
      legend_closed: 'ముగిసింది (సమయం దాటింది)',
      bookings_for_slot: 'స్లాట్ కోసం బుకింగ్‌లు',
      select_booking_workflow: 'సేకరణ & చెల్లింపు వర్క్‌ఫ్లో తెరవడానికి ఏదైనా బుకింగ్‌ను ఎంచుకోండి.',
      th_queue_hash: 'క్యూ సంఖ్య',
      th_farmer_name_phone: 'రైతు పేరు & ఫోన్',
      th_channel: 'ఛానల్',
      th_approval: 'ఆమోదం',
      th_proc_status: 'సేకరణ స్థితి',
      th_action: 'చర్య',
      btn_call_now: 'కాల్ చేయండి',
      modal_walkin_title: 'వాక్-ఇన్ (ఆఫ్‌లైన్) బుకింగ్‌ను జోడించండి',
      walkin_rule_notice: 'కఠినమైన నియమం: వాక్-ఇన్ నమోదులు స్లాట్‌కు గరిష్టంగా 2కి పరిమితం. 3వ ప్రయత్నం నిరోధించబడుతుంది.',
      label_farmer_name: 'రైతు పేరు *',
      label_crop_name: 'పంట పేరు *',
      placeholder_walkin_crop: 'ఉదా. టమాటా (హైబ్రిడ్), గోధుమ',
      label_est_qty_kg: 'అంచనా పరిమాణం (కిలోలు) *',
      label_select_walkin_slot: 'వాక్-ఇన్ కోసం స్లాట్ ఎంచుకోండి *',
      btn_cancel: 'రద్దు చేయి',
      btn_save_walkin: 'వాక్-ఇన్ బుకింగ్‌ను సేవ్ చేయండి →',
      modal_wf_title: 'సేకరణ & పరిష్కార వర్క్‌ఫ్లో',
      wf_sec_1: '1. రైతు & బుకింగ్ వివరాలు',
      wf_sec_2: '2. భౌతిక తనిఖీ & నాణ్యత గ్రేడింగ్',
      wf_sec_3: '3. చెల్లింపు విధానం & పరిష్కారం',
      wf_sec_4: '4. తుది మొత్తం & ధృవీకరణ',
      label_actual_qty: 'వాస్తవ తూకం పరిమాణం (కిలోలు) *',
      label_quality_grade: 'నాణ్యత గ్రేడ్ *',
      label_agreed_price: 'యూనిట్‌కు అంగీకరించిన ధర (₹ / కిలో) *',
      label_payment_mode: 'చెల్లింపు విధానం *',
      label_payment_status: 'చెల్లింపు స్థితి *',
      label_txn_ref: 'లావాదేవీ రిఫరెన్స్ / UTR నంబర్ *',
      label_auto_calc: 'స్వయంచాలక గణన (పరిమాణం × రేటు):',
      label_final_payout: 'తుది చెల్లింపు మొత్తం:',
      label_final_override: 'తుది మొత్తాన్ని సరిచేయండి (₹)',
      help_override: 'తేమ, శుభ్రపరచడం లేదా లేబర్ ఖర్చుల కోసం మాన్యువల్ సర్దుబాటు అవసరమైతేనే సవరించండి.',
      btn_accept_generate_receipt: 'ఆమోదించి అధికారిక రసీదును రూపొందించండి →',
      modal_edit_slot_title: 'స్లాట్ కాన్ఫిగరేషన్‌ను సవరించండి',
      label_start_time: 'ప్రారంభ సమయం (HH:MM:SS)',
      label_end_time: 'ముగింపు సమయం (HH:MM:SS)',
      label_max_capacity: 'గరిష్ట బుకింగ్ సామర్థ్యం *',
      btn_save_changes: 'మార్పులను సేవ్ చేయండి',
      modal_add_member_title: 'మండి సభ్యుడిని జోడించండి',
      label_assign_role: 'పాత్రను కేటాయించండి',
      btn_create_staff: 'సిబ్బంది ఖాతాను సృష్టించండి',
      btn_close: 'మూసివేయి',
      btn_print: 'ప్రింట్ చేయి',
      btn_download_png: 'PNG డౌన్‌లోడ్ చేయండి',
      receipt_modal_title: 'అధికారిక సేకరణ రసీదు',
      receipt_badge_gemini: 'Gemini AI ద్వారా రూపొందించిన రసీదు',
      receipt_badge_verified: 'ధృవీకరించబడిన మండి రసీదు (కాన్వాస్)',

      // Admin Portal
      admin_control_desk: 'రియల్ టైమ్ క్యూ డెస్క్',
      admin_now_serving: 'ఇప్పుడు సేవ పొందుతున్నది:',
      admin_btn_call_next: '📢 తదుపరి రైతును పిలవండి',
      admin_call_next_sub: 'క్యూ ముందుకు సాగడం తదుపరి 2 రైతులకు SMS ద్వారా తెలియజేస్తుంది',
      admin_today_queue: 'నేటి సేకరణ క్యూ',
      admin_update_prompt: 'పంటను గ్రేడ్ చేయడానికి & చెల్లింపును ప్రాసెస్ చేయడానికి "Update" పై క్లిక్ చేయండి',
      admin_analytics: 'సేకరణ కేంద్రం విశ్లేషణలు & రద్దీ',
      metric_total_bookings: 'ఈ రోజు మొత్తం బుకింగ్‌లు',
      metric_farmers_served: 'సేవ పొందిన రైతులు',
      metric_procured_vol: 'మొత్తం సేకరించిన పరిమాణం',
      metric_total_payout: 'పంపిణీ చేసిన మొత్తం చెల్లింపు',
      metric_avg_wait: 'సగటు నిరీక్షణ సమయం',
      chart_hourly_congestion: 'గంటవారీ రైతుల రాక & రద్దీ',
      chart_crop_share: 'పంటల వారీగా సేకరణ వాటా',
      admin_manage_rates: 'రోజువారీ మండి పంట ధరలను నిర్వహించండి',
      admin_rates_desc: 'ధర సవరణలు వెబ్‌సాకెట్‌ల ద్వారా పబ్లిక్ లైవ్ టిక్కర్ మరియు రైతు డాష్‌బోర్డ్‌కు తక్షణమే ప్రసారం చేయబడతాయి.',
      th_crop: 'పంట',
      th_current_rate: 'ప్రస్తుత ధర (₹/క్వి)',
      th_prev_rate: 'మునుపటి ధర (₹/క్వి)',
      th_trend: 'ట్రెండ్',
      th_update_price: 'ధరను నవీకరించండి',
      admin_add_crop_title: '➕ కొత్త పంట ధరను జోడించండి',
      label_initial_rate: 'ప్రారంభ ధర (క్వింటాల్‌కు ₹)',
      btn_add_to_ticker: 'మండి టిక్కర్‌కు జోడించండి →',
      modal_update_payout: 'సేకరణ & చెల్లింపును నవీకరించండి',
      label_proc_quality_status: 'సేకరణ నాణ్యత స్థితి',
      label_final_weighed_qty: 'తుది తూకం పరిమాణం (కిలోలు)',
      label_pay_disbursal_status: 'చెల్లింపు పంపిణీ స్థితి',
      label_final_settlement_amt: 'తుది పరిష్కార మొత్తం (₹ INR)',
      btn_save_notify_farmer: 'సేవ్ చేసి రైతుకు తెలియజేయండి',

      // Dynamic Status Badges & Channels
      status_booked: 'బుక్ చేయబడింది',
      status_in_queue: 'క్యూలో ఉంది',
      status_completed: 'పూర్తయింది',
      status_cancelled: 'రద్దు చేయబడింది',
      status_pending: 'పెండింగ్‌లో ఉంది',
      status_weighed: 'తూకం వేయబడింది',
      status_graded: 'గ్రేడింగ్ పూర్తయింది',
      status_accepted: 'ఆమోదించబడింది',
      status_rejected: 'తిరస్కరించబడింది',
      status_processing: 'ప్రాసెసింగ్',
      status_paid: 'చెల్లించబడింది',
      status_approved: 'ఆమోదించబడింది',
      channel_online: 'ఆన్‌లైన్ బుకింగ్',
      channel_offline: 'వాక్-ఇన్ (ఆఫ్‌లైన్)',
      grade_a: 'గ్రేడ్ A (ప్రీమియం నాణ్యత)',
      grade_b: 'గ్రేడ్ B (ప్రామాణిక మార్కెట్)',
      grade_c: 'గ్రేడ్ C (సాధారణ / వాణిజ్య)',
      grade_rejected: 'తిరస్కరించబడింది (నాణ్యత లోపం)',
      pay_cash: 'నగదు',
      pay_upi: 'UPI (QR / PhonePe / GPay)',
      pay_bank: 'నేరుగా బ్యాంక్ బదిలీ (NEFT / RTGS)',

      // Crop Categories & Form Labels
      crop_cat_cereals: '🌾 తృణధాన్యాలు & గింజలు',
      crop_cat_pulses: '🌿 పప్పుధాన్యాలు',
      crop_cat_oilseeds: '🌱 నూనెగింజలు',
      crop_cat_cash: '🎋 వాణిజ్య పంటలు & పీచు',
      crop_cat_veg_fruits: '🍅 కూరగాయలు & పండ్లు',
      crop_cat_spices: '🧂 సుగంధ ద్రవ్యాలు',
      queue_crop_label: 'పంట',

      // Footer
      footer_rights: 'అగ్రికనెక్ట్ — స్మార్ట్ వ్యవసాయ సేకరణ & ప్రత్యక్ష క్యూ మౌలిక సదుపాయాలు.',
      footer_support_farmers: 'పారదర్శక సేకరణ విధానాలు మరియు న్యాయమైన మార్కెట్ ధరలతో రైతులకు మద్దతు ఇవ్వడం.',
      footer_farmer_dashboard: 'అగ్రికనెక్ట్ — రైతు డాష్‌బోర్డ్.',
      footer_need_support: 'మీ స్లాట్ లేదా క్యూ టోకెన్‌తో మద్దతు కావాలా? మండి మద్దతును సంప్రదించండి.',
      footer_mandi_desk: 'అగ్రికనెక్ట్ మండి నిర్వహణ డెస్క్ • జాతీయ APMC నెట్‌వర్క్'
    },

    hi: {
      // Header & Brand
      brand_title: 'एग्रीकनेक्ट',
      brand_tagline: 'अपनी फसल के लिए अब कतारों में इंतजार नहीं।',
      brand_farmer_portal: 'किसान खरीद पोर्टल',
      brand_mandi_desk: 'मंडी डेस्क · एपीएमसी यार्ड',
      brand_admin_title: 'एग्रीकनेक्ट एडमिन',
      brand_admin_tagline: 'खरीद संचालन और मंडी नियंत्रण',
      theme_dark: 'डार्क मोड',
      theme_light: 'लाइट मोड',
      nav_login: 'लॉगिन',
      nav_signup: 'साइन अप',
      nav_logout: 'लॉगआउट',
      nav_notifications: 'सूचनाएं',
      nav_mark_all_read: 'सभी को पढ़ा हुआ चिह्नित करें',
      nav_alerts_heading: 'खरीद और एसएमएस अलर्ट',
      nav_loading_alerts: 'अलर्ट लोड हो रहे हैं...',
      nav_mandi_directory: 'मंडी निर्देशिका',
      nav_mandi_rates: 'मंडी भाव',
      nav_farmer_portal_link: 'किसान पोर्टल',

      // Landing Hero & Features
      hero_title: 'सीधा मंडी प्रवेश। <span>शून्य प्रतीक्षा।</span> गारंटीड भुगतान।',
      hero_desc: 'अपने मोबाइल से खरीद स्लॉट बुक करें, लाइव प्रतीक्षा समय के साथ अपनी कतार स्थिति ट्रैक करें, और तौल से लेकर सीधे बैंक ट्रांसफर तक हर चरण पर स्वचालित एसएमएस अपडेट प्राप्त करें।',
      hero_feat_1_title: 'लाइव कतार ट्रैकर',
      hero_feat_1_desc: 'पहुंचने से पहले सटीक प्रतीक्षा समय जानें',
      hero_feat_2_title: 'पारदर्शी ग्रेडिंग',
      hero_feat_2_desc: 'वेब्रिज से स्वीकृति तक लाइव स्थिति',
      hero_feat_3_title: 'दैनिक मंडी टिकर',
      hero_feat_3_desc: 'वास्तविक समय एपीएमसी बेंचमार्क दरें',
      hero_welcome_title: 'एग्रीकनेक्ट में आपका स्वागत है',
      hero_welcome_desc: 'भारत का स्मार्ट कृषि खरीद और लाइव कतार इन्फ्रास्ट्रक्चर',
      meta_pan_india: 'अखिल भारतीय',
      meta_31_states: '31 राज्य और केंद्र शासित प्रदेश',
      meta_zero_waiting: 'शून्य प्रतीक्षा',
      meta_queue_tracker: 'लाइव कतार ट्रैकर',
      meta_guaranteed: 'गारंटीड',
      meta_direct_payout: 'सीधा बैंक भुगतान',

      // Mandi Rates Section
      rates_title: 'आज के मंडी बेंचमार्क भाव',
      rates_subtitle: 'क्षेत्रीय एपीएमसी खरीद केंद्रों से सीधे अपडेट की जाने वाली लाइव थोक कृषि दरें।',
      rates_auto_refresh: 'वास्तविक समय में स्वतः रीफ्रेश',
      rates_search_placeholder: '🔍 फसल खोजें (उदा. गेहूं, गन्ना, मिर्च, कपास, हल्दी)...',
      rates_showing_crops: 'सभी 30 मंडी फसलें प्रदर्शित',
      rates_loading: 'लाइव बाजार भाव लोड हो रहे हैं...',
      rates_no_crops: 'कोई फसल नहीं मिली',
      rates_no_crops_sub: 'खोज से कोई मंडी बेंचमार्क भाव मेल नहीं खाया। सभी फसलें देखने के लिए खोज साफ़ करें।',

      // Mandi Directory Section
      mandi_dir_title: 'भारत भर के सभी खरीद केंद्र',
      mandi_dir_subtitle: '31 राज्यों और केंद्र शासित प्रदेशों में सभी अधिकृत एपीएमसी खरीद केंद्रों को खोजें। अपना आगमन स्लॉट बुक करने के लिए कोई भी मंडी चुनें।',
      mandi_search_placeholder: '🔍 नाम, शहर, जिला या पते से मंडी खोजें...',
      mandi_all_states: 'सभी राज्य (अखिल भारतीय)',
      mandi_loading: 'भारत भर की खरीद मंडियां लोड हो रही हैं...',
      btn_book_slot_mandi: 'इस मंडी में स्लॉट बुक करें →',
      label_capacity: 'क्षमता',
      label_farmers_per_day: 'किसान/दिन',
      label_hours: 'समय',
      label_mandi_benchmark_rate: 'मंडी बेंचमार्क भाव / क्विंटल',
      label_prev: 'पिछला',
      ticker_live_mandi: '🔴 लाइव मंडी',
      ticker_market_rates: 'मंडी भाव',
      ticker_price: 'भाव',
      ticker_previous: 'पिछला',
      ticker_updated: 'अपडेट किया गया',
      ticker_increase: 'वृद्धि',
      ticker_decrease: 'कमी',
      ticker_no_change: 'कोई बदलाव नहीं',
      time_just_now: 'अभी',
      time_sec_ago: 'सेकंड पहले',
      time_min_ago: 'मिनट पहले',
      time_hour_ago: 'घंटे पहले',
      rates_showing_prefix: 'प्रदर्शित',
      rates_of: 'में से',
      rates_mandi_crops: 'मंडी फसलें',

      // Role Selection & Auth Modals
      auth_modal_login_title: 'एग्रीकनेक्ट में लॉगिन करें',
      auth_modal_signup_title: 'एग्रीकनेक्ट खाता बनाएं',
      role_select_heading_login: 'अपना लॉगिन पोर्टल चुनें',
      role_select_heading_signup: 'पंजीकरण भूमिका चुनें',
      role_select_subheading_login: 'चुनें कि आप किसान के रूप में लॉगिन कर रहे हैं या मंडी एपीएमसी डेस्क के रूप में',
      role_select_subheading_signup: 'नया किसान खाता या एपीएमसी मंडी केंद्र पंजीकृत करने के लिए अपनी भूमिका चुनें',
      role_farmer_title: 'किसान',
      role_farmer_desc: 'किसानों के लिए खरीद स्लॉट बुक करने, लाइव कतार ट्रैक करने और भुगतान प्राप्त करने के लिए।',
      role_farmer_btn_login: 'किसान के रूप में लॉगिन करें →',
      role_farmer_btn_signup: 'किसान के रूप में पंजीकरण करें →',
      role_mandi_title: 'मंडी',
      role_mandi_desc: 'एपीएमसी मंडी अधिकारियों, वेब्रिज ऑपरेटरों और केंद्र प्रशासकों के लिए।',
      role_mandi_btn_login: 'मंडी स्टाफ के रूप में लॉगिन करें →',
      role_mandi_btn_signup: 'मंडी और एडमिन पंजीकृत करें →',
      back_btn: '← वापस',
      footer_no_account: 'खाता नहीं है?',
      footer_signup_here: 'यहाँ साइन अप करें',
      footer_have_account: 'क्या आपके पास पहले से एक खाता मौजूद है?',
      footer_login_here: 'यहाँ लॉगिन करें',

      // Auth Forms
      farmer_login_heading: '🌾 किसान सुरक्षित लॉगिन',
      farmer_reg_heading: '🌾 किसान पंजीकरण',
      mandi_login_heading: '🏢 मंडी स्टाफ लॉगिन',
      mandi_reg_heading: '🏛️ मंडी केंद्र और एडमिन पंजीकरण',
      label_farmer_phone: 'किसान पंजीकृत फोन नंबर',
      placeholder_farmer_phone: 'उदा. 9876543210',
      label_password: 'पासवर्ड',
      placeholder_password: 'अपना पासवर्ड दर्ज करें',
      btn_farmer_login: 'किसान सुरक्षित लॉगिन →',
      demo_farmer_badge: 'डेमो किसान खाता:',
      switch_to_farmer_reg: 'किसान खाता नहीं है? किसान के रूप में पंजीकरण करें →',
      label_full_name: 'पूरा नाम',
      placeholder_full_name: 'उदा. रमेश कुमार पाटिल',
      label_phone_10: 'फोन नंबर (10 अंक) *',
      placeholder_phone_10: 'उदा. 9822001122',
      help_phone: '6, 7, 8 या 9 से शुरू होने वाला मान्य 10 अंकों का मोबाइल नंबर होना चाहिए।',
      label_create_password: 'पासवर्ड बनाएं',
      placeholder_min_6: 'कम से कम 6 अक्षर',
      label_village: 'गाँव / पता',
      placeholder_village: 'उदा. डिंडोरी, नासिक',
      label_aadhaar: 'आधार कार्ड नंबर (12 अंक) *',
      placeholder_aadhaar: 'उदा. 5421 8921 4412',
      help_aadhaar: 'सटीक 12 संख्यात्मक अंक होने चाहिए।',
      label_crops_grown: 'उगाई जाने वाली फसलें (सभी लागू चुनें)',
      placeholder_custom_crop: 'ऊपर सूचीबद्ध नहीं की गई फसल जोड़ें',
      btn_add_crop: '+ जोड़ें',
      btn_complete_farmer_reg: 'किसान पंजीकरण पूर्ण करें →',
      switch_to_farmer_login: 'पहले से पंजीकृत हैं? किसान लॉगिन →',
      label_mandi_phone: 'मंडी स्टाफ आधिकारिक मोबाइल',
      placeholder_mandi_phone: 'उदा. 9999999999',
      help_mandi_staff: 'अधिकृत एपीएमसी मंडी अधिकारी, वेब्रिज स्टाफ और एडमिन।',
      label_staff_password: 'स्टाफ पासवर्ड',
      placeholder_staff_password: 'पासवर्ड दर्ज करें',
      btn_mandi_login: 'मंडी स्टाफ लॉगिन →',
      demo_staff_badge: 'प्री-सीडेड स्टाफ खाता:',
      switch_to_mandi_reg: 'क्या नया मंडी केंद्र पंजीकृत करना है? मंडी और एडमिन पंजीकृत करें →',
      mandi_reg_intro: 'एक नए एपीएमसी मंडी केंद्र और उसके प्राथमिक मंडी एडमिन खाते को पंजीकृत करें।',
      label_mandi_name: 'मंडी / केंद्र का नाम *',
      placeholder_mandi_name: 'उदा. नासिक मुख्य एपीएमसी यार्ड',
      label_district: 'जिला / शहर *',
      placeholder_district: 'उदा. नासिक',
      label_state: 'राज्य *',
      placeholder_state: 'उदा. महाराष्ट्र',
      label_location: 'स्थान / पता',
      placeholder_location: 'उदा. मार्केट यार्ड, पंचवटी',
      label_daily_capacity: 'दैनिक क्षमता (किसान/दिन)',
      label_crops_procured: 'खरीदी जाने वाली फसलें',
      placeholder_crops_procured: 'उदा. गेहूं, टमाटर, प्याज',
      label_primary_admin: 'प्राथमिक मंडी एडमिन विवरण',
      label_admin_fullname: 'एडमिन का पूरा नाम *',
      placeholder_admin_fullname: 'उदा. राजेश शर्मा',
      label_admin_phone: 'आधिकारिक मोबाइल नंबर (10 अंक) *',
      label_admin_password: 'एडमिन पासवर्ड बनाएं *',
      btn_register_mandi: 'मंडी और एडमिन खाता पंजीकृत करें →',
      switch_to_mandi_login: 'पहले से मंडी स्टाफ के रूप में पंजीकृत हैं? मंडी स्टाफ लॉगिन →',
      label_select_mandi_centre: 'मंडी / खरीद केंद्र चुनें * (114 अखिल भारतीय एपीएमसी)',
      placeholder_search_114_mandis: '🔍 नाम, जिला, राज्य द्वारा 114 मंडियों को खोजें...',
      btn_change_mandi: 'मंडी बदलें',
      mandi_loading_list: '114 मंडियां लोड हो रही हैं...',
      mandi_mandis_found: 'मंडियां मिलीं',
      legend_available: 'उपलब्ध',
      legend_claimed: 'पहले से दावा किया गया',
      badge_available: 'उपलब्ध',
      badge_claimed: 'पहले से पंजीकृत',
      mandi_none_found: 'आपकी खोज से मेल खाने वाली कोई मंडी नहीं मिली।',
      mandi_error_claimed: 'यह मंडी केंद्र पहले से ही एक मंडी एडमिन द्वारा पंजीकृत है और इसे दोबारा दावा नहीं किया जा सकता है।',
      mandi_error_select_required: 'पंजीकरण करने से पहले कृपया सूची में से एक उपलब्ध मंडी केंद्र का चयन करें।',

      // Password Hint & Forgot Password Recovery
      link_forgot_password: 'पासवर्ड भूल गए?',
      password_hint_title: 'पासवर्ड संकेत (हिंट) रिमाइंडर',
      password_hint_subtitle: 'अपना पासवर्ड संकेत देखने के लिए अपना पंजीकृत मोबाइल नंबर दर्ज करें',
      forgot_phone_label: 'पंजीकृत मोबाइल नंबर (10 अंक)',
      btn_get_hint: 'पासवर्ड संकेत प्राप्त करें →',
      label_password_hint: 'पासवर्ड संकेत / हिंट (वैकल्पिक)',
      placeholder_password_hint: 'उदा. पसंदीदा ट्रैक्टर ब्रांड या कुलदेवता',
      help_password_hint: 'ऐसा संकेत जोड़ें जो आपको अपना पासवर्ड याद रखने में मदद करे। अपना वास्तविक पासवर्ड दर्ज न करें।',
      your_password_hint_label: 'आपका पासवर्ड संकेत:',
      hint_reminder_text: 'अपना पासवर्ड याद रखने और लॉगिन पृष्ठ पर वापस जाने के लिए इस संकेत का उपयोग करें।',
      hint_recovery_info: 'खाता पुनर्प्राप्ति जानकारी',
      hint_not_found_neutral: 'यदि इस मोबाइल नंबर से कोई खाता मौजूद है, तो आपकी संकेत जानकारी प्रदर्शित की जाएगी।',
      hint_helpline_note: 'यदि आपने कोई संकेत कॉन्फ़िगर नहीं किया है या अपना पासवर्ड याद नहीं कर पा रहे हैं, तो कृपया सहायता के लिए एग्रीकनेक्ट मंडी सहायता या अपने स्थानीय एपीएमसी हेल्पडेस्क से संपर्क करें।',
      btn_back_to_login: '← वापस लॉगिन पर जाएं',
      label_confirm_password: 'पासवर्ड की पुष्टि करें *',
      placeholder_confirm_password: 'पासवर्ड दोबारा दर्ज करें',
      err_password_mismatch: 'पासवर्ड मेल नहीं खाते। कृपया दोबारा दर्ज करें।',
      err_hint_same_as_password: 'पासवर्ड संकेत आपके वास्तविक पासवर्ड के समान नहीं हो सकता। कृपया केवल एक अनुस्मारक संकेत प्रदान करें।',

      // Farmer Dashboard & Booking
      card_book_slot: 'खरीद स्लॉट बुक करें',
      sub_instant_token: 'तत्काल टोकन पुष्टि',
      label_select_state: 'राज्य चुनें',
      label_filter_city: 'शहर फ़िल्टर करें',
      placeholder_filter_city: 'शहर टाइप करें (उदा. पुणे, जयपुर)...',
      label_centre_select: 'खरीद केंद्र (एपीएमसी / मंडी)',
      option_loading_centres: 'केंद्र लोड हो रहे हैं...',
      label_appt_date: 'अपॉइंटमेंट तिथि',
      label_select_slot: 'आगमन का प्रति घंटा स्लॉट चुनें',
      slots_select_centre_first: 'स्लॉट देखने के लिए पहले केंद्र चुनें।',
      label_crop_to_sell: 'बेचने के लिए फसल',
      choose_crop_placeholder: '-- बेचने के लिए फसल चुनें (30 फसलें उपलब्ध) --',
      label_quantity_est: 'अनुमानित फसल मात्रा (किलोग्राम में)',
      placeholder_qty: 'उदा. 500',
      help_weighed_at_mandi: 'अंतिम मूल्य मंडी काउंटर पर तौलकर तय किया जाता है।',
      btn_confirm_booking: 'पुष्टि करें और स्लॉट बुक करें →',
      card_my_crops: 'मेरी पंजीकृत फसलें',
      text_crops_highlighted: 'आपकी पंजीकृत फसलों के भाव ऊपर लाइव मंडी टिकर में स्वतः हाइलाइट होते हैं।',
      card_how_it_works: 'एग्रीकनेक्ट कतार कैसे काम करती है',
      step_1: 'अपना वाहन लोड करने से पहले अपना स्लॉट बुक करें।',
      step_2: 'अपनी कतार स्थिति और लाइव अनुमानित प्रतीक्षा समय यहीं देखें।',
      step_3: 'आपकी बारी आने पर आपको स्वचालित सूचनाएं प्राप्त होंगी।',
      step_4: 'काउंटर पर पहुंचें, अपनी फसल को पारदर्शी तरीके से तुलवाएं और ग्रेड कराएं।',
      step_5: 'प्रक्रिया पूरी होने पर भुगतान स्थिति सीधे आपके डैशबोर्ड पर अपडेट होती है।',
      card_my_bookings: 'मेरी खरीद बुकिंग',
      sub_live_status: 'बुकिंग से लेकर भुगतान तक की लाइव स्थिति',
      th_date_time: 'दिनांक और समय',
      th_centre: 'केंद्र',
      th_crop_token: 'फसल और टोकन',
      th_quantity: 'मात्रा',
      th_booking_status: 'बुकिंग स्थिति',
      th_procurement: 'खरीद',
      th_payment: 'भुगतान',
      th_final_amount: 'अंतिम राशि',
      th_action_receipt: 'कार्रवाई / रसीद',
      btn_receipt: 'रसीद',
      no_bookings_yet: 'अभी तक कोई बुकिंग नहीं मिली। ऊपर अपना पहला खरीद स्लॉट बुक करें!',
      loading_bookings: 'आपकी बुकिंग लोड हो रही है...',

      // Live Queue Tracker
      queue_tracker_title: 'लाइव खरीद कतार ट्रैकर',
      queue_your_turn: 'आपकी बारी आ गई है!',
      queue_your_token: 'आपका टोकन',
      queue_now_serving: 'वर्तमान में सेवा जारी',
      queue_pos_in_line: 'कतार में स्थान',
      queue_est_wait: 'अनुमानित प्रतीक्षा',
      queue_now: 'अभी!',
      queue_mins: 'मिनट',
      queue_no_active: 'आज कोई सक्रिय कतार नहीं है',
      queue_no_active_desc: 'वास्तविक समय कतार टोकन प्राप्त करने के लिए खरीद केंद्र चुनें और नीचे स्लॉट बुक करें।',
      queue_upcoming_confirmed: 'आगामी बुकिंग की पुष्टि हुई',
      queue_live_tracker_day_of_visit: 'आगमन के दिन लाइव ट्रैकर सक्रिय होगा',
      queue_proceed_counter: 'कृपया अपनी फसल लेकर तुरंत खरीद डेस्क पर पहुंचें!',
      queue_you_are_next: 'अगली बारी आपकी है! कृपया तुरंत काउंटर के पास पहुंचें।',
      queue_token_label: 'कतार टोकन',
      auto_updates_realtime: 'वास्तविक समय में स्वतः अपडेट',

      // Mandi Desk Page & Modals
      mandi_admin_controls: 'मंडी प्रशासनिक नियंत्रण',
      mandi_admin_desc: 'स्टाफ खातों का प्रबंधन करें, प्रति घंटा स्लॉट क्षमता संपादित करें और खरीद कार्यों की निगरानी करें।',
      btn_staff_directory: 'मंडी स्टाफ निर्देशिका',
      btn_add_member: 'मंडी सदस्य जोड़ें',
      live_slot_grid: 'लाइव स्लॉट ग्रिड',
      btn_refresh: 'रीफ्रेश',
      btn_register_walkin: 'वॉक-इन (ऑफ़लाइन) किसान पंजीकरण',
      hourly_ops_board: 'प्रति घंटा संचालन बोर्ड',
      legend_open: 'खुला (अनबुक)',
      legend_partial: 'आंशिक (1 वॉक-इन)',
      legend_full: 'भरा हुआ (अधिकतम)',
      legend_closed: 'बंद (समय समाप्त)',
      bookings_for_slot: 'स्लॉट के लिए बुकिंग',
      select_booking_workflow: 'खरीद और भुगतान वर्कफ़्लो खोलने के लिए कोई भी बुकिंग चुनें।',
      th_queue_hash: 'कतार क्रमांक',
      th_farmer_name_phone: 'किसान का नाम और फोन',
      th_channel: 'माध्यम',
      th_approval: 'स्वीकृति',
      th_proc_status: 'खरीद स्थिति',
      th_action: 'कार्रवाई',
      btn_call_now: 'कॉल करें',
      modal_walkin_title: 'वॉक-इन (ऑफ़लाइन) बुकिंग जोड़ें',
      walkin_rule_notice: 'सख्त नियम: वॉक-इन पंजीकरण प्रति स्लॉट अधिकतम 2 तक सीमित हैं। तीसरा प्रयास अवरुद्ध कर दिया जाएगा।',
      label_farmer_name: 'किसान का नाम *',
      label_crop_name: 'फसल का नाम *',
      placeholder_walkin_crop: 'उदा. टमाटर (हाइब्रिड), गेहूं',
      label_est_qty_kg: 'अनुमानित मात्रा (किलो) *',
      label_select_walkin_slot: 'वॉक-इन के लिए स्लॉट चुनें *',
      btn_cancel: 'रद्द करें',
      btn_save_walkin: 'वॉक-इन बुकिंग सहेजें →',
      modal_wf_title: 'खरीद और निपटान वर्कफ़्लो',
      wf_sec_1: '1. किसान और बुकिंग विवरण',
      wf_sec_2: '2. भौतिक निरीक्षण और गुणवत्ता ग्रेडिंग',
      wf_sec_3: '3. भुगतान का तरीका और निपटान',
      wf_sec_4: '4. अंतिम राशि और सत्यापन',
      label_actual_qty: 'वास्तविक तौली गई मात्रा (किलो) *',
      label_quality_grade: 'गुणवत्ता ग्रेड *',
      label_agreed_price: 'प्रति यूनिट सहमत मूल्य (₹ / किलो) *',
      label_payment_mode: 'भुगतान का तरीका *',
      label_payment_status: 'भुगतान स्थिति *',
      label_txn_ref: 'लेन-देन संदर्भ / यूटीआर नंबर *',
      label_auto_calc: 'स्वतः परिकलित (मात्रा × दर):',
      label_final_payout: 'अंतिम भुगतान राशि:',
      label_final_override: 'अंतिम राशि संशोधन (₹)',
      help_override: 'नमी, सफाई या मजदूरी शुल्क के लिए आवश्यक होने पर ही संपादित करें।',
      btn_accept_generate_receipt: 'स्वीकार करें और आधिकारिक रसीद बनाएं →',
      modal_edit_slot_title: 'स्लॉट कॉन्फ़िगरेशन संपादित करें',
      label_start_time: 'प्रारंभ समय (HH:MM:SS)',
      label_end_time: 'समाप्ति समय (HH:MM:SS)',
      label_max_capacity: 'अधिकतम बुकिंग क्षमता *',
      btn_save_changes: 'परिवर्तन सहेजें',
      modal_add_member_title: 'मंडी सदस्य जोड़ें',
      label_assign_role: 'भूमिका सौंपें',
      btn_create_staff: 'स्टाफ खाता बनाएं',
      btn_close: 'बंद करें',
      btn_print: 'प्रिंट करें',
      btn_download_png: 'पीएनजी डाउनलोड करें',
      receipt_modal_title: 'आधिकारिक खरीद रसीद',
      receipt_badge_gemini: 'Gemini AI जनरेटेड रसीद',
      receipt_badge_verified: 'सत्यापित मंडी रसीद (कैनवास)',

      // Admin Portal
      admin_control_desk: 'वास्तविक समय कतार डेस्क',
      admin_now_serving: 'वर्तमान सेवा जारी:',
      admin_btn_call_next: '📢 अगले किसान को बुलाएं',
      admin_call_next_sub: 'कतार आगे बढ़ाने से अगले 2 किसानों को एसएमएस द्वारा सतर्क किया जाता है',
      admin_today_queue: 'आज की खरीद कतार',
      admin_update_prompt: 'फसल को ग्रेड करने और भुगतान के लिए "Update" पर क्लिक करें',
      admin_analytics: 'खरीद केंद्र विश्लेषण और भीड़',
      metric_total_bookings: 'आज कुल बुकिंग',
      metric_farmers_served: 'लाभान्वित किसान',
      metric_procured_vol: 'कुल खरीदी गई मात्रा',
      metric_total_payout: 'कुल वितरित भुगतान',
      metric_avg_wait: 'औसत प्रतीक्षा समय',
      chart_hourly_congestion: 'प्रति घंटा किसानों का आगमन और भीड़',
      chart_crop_share: 'फसलवार खरीद हिस्सेदारी',
      admin_manage_rates: 'दैनिक मंडी फसल दरों का प्रबंधन करें',
      admin_rates_desc: 'मूल्य संशोधन वेबसॉकेट्स के माध्यम से लाइव टिकर और किसान डैशबोर्ड पर तुरंत प्रसारित होते हैं।',
      th_crop: 'फसल',
      th_current_rate: 'वर्तमान भाव (₹/क्वि)',
      th_prev_rate: 'पिछला भाव (₹/क्वि)',
      th_trend: 'रुझान',
      th_update_price: 'भाव अपडेट करें',
      admin_add_crop_title: '➕ नई फसल दर जोड़ें',
      label_initial_rate: 'प्रारंभिक दर (₹ प्रति क्विंटल)',
      btn_add_to_ticker: 'मंडी टिकर में जोड़ें →',
      modal_update_payout: 'खरीद और भुगतान अपडेट करें',
      label_proc_quality_status: 'खरीद गुणवत्ता स्थिति',
      label_final_weighed_qty: 'अंतिम तौली गई मात्रा (किलो)',
      label_pay_disbursal_status: 'भुगतान वितरण स्थिति',
      label_final_settlement_amt: 'अंतिम निपटान राशि (₹ INR)',
      btn_save_notify_farmer: 'सहेजें और किसान को सूचित करें',

      // Dynamic Status Badges & Channels
      status_booked: 'बुक किया गया',
      status_in_queue: 'कतार में',
      status_completed: 'पूर्ण',
      status_cancelled: 'रद्द',
      status_pending: 'लंबित',
      status_weighed: 'तौल संपन्न',
      status_graded: 'ग्रेडिंग संपन्न',
      status_accepted: 'स्वीकृत',
      status_rejected: 'अस्वीकृत',
      status_processing: 'प्रक्रिया जारी',
      status_paid: 'भुगतान संपन्न',
      status_approved: 'स्वीकृत',
      channel_online: 'ऑनलाइन बुकिंग',
      channel_offline: 'वॉक-इन (ऑफ़लाइन)',
      grade_a: 'ग्रेड ए (प्रीमियम गुणवत्ता)',
      grade_b: 'ग्रेड बी (मानक बाजार)',
      grade_c: 'ग्रेड सी (उचित / व्यावसायिक)',
      grade_rejected: 'अस्वीकृत (मानक से कम)',
      pay_cash: 'नकद',
      pay_upi: 'यूपीआई (QR / PhonePe / GPay)',
      pay_bank: 'सीधा बैंक ट्रांसफर (NEFT / RTGS)',

      // Crop Categories & Form Labels
      crop_cat_cereals: '🌾 अनाज और खाद्यान्न',
      crop_cat_pulses: '🌿 दालें और दलहन',
      crop_cat_oilseeds: '🌱 तिलहन',
      crop_cat_cash: '🎋 नकदी फसलें और रेशे',
      crop_cat_veg_fruits: '🍅 सब्जियां और फल',
      crop_cat_spices: '🧂 मसाले',
      queue_crop_label: 'फसल',

      // Footer
      footer_rights: 'एग्रीकनेक्ट — स्मार्ट कृषि खरीद और लाइव कतार इन्फ्रास्ट्रक्चर।',
      footer_support_farmers: 'पारदर्शी खरीद प्रक्रियाओं और उचित बाजार मूल्यों के साथ किसानों का समर्थन।',
      footer_farmer_dashboard: 'एग्रीकनेक्ट — किसान डैशबोर्ड।',
      footer_need_support: 'अपने स्लॉट या कतार टोकन के लिए सहायता चाहिए? मंडी सहायता से संपर्क करें।',
      footer_mandi_desk: 'एग्रीकनेक्ट मंडी संचालन डेस्क • राष्ट्रीय एपीएमसी नेटवर्क'
    }
  };

  // Centralized Crop Translations (all 30 benchmark Mandi crops and variants)
  const CROP_TRANSLATIONS = {
    // 22 User Benchmark crops (Full database benchmark names)
    'Apple (Royal Delicious)': { en: 'Apple (Royal Delicious)', te: 'ఆపిల్ (రాయల్ డెలిషియస్)', hi: 'सेब (रॉयल डिलीशियस)' },
    'Arecanut (Supari)': { en: 'Arecanut (Supari)', te: 'వక్క (సుపారి)', hi: 'सुपारी' },
    'Bajra (Pearl Millet)': { en: 'Bajra (Pearl Millet)', te: 'సజ్జలు (పెర్ల్ మిల్లెట్)', hi: 'बाजरा' },
    'Banana (Robusta)': { en: 'Banana (Robusta)', te: 'అరటి (రోబస్టా)', hi: 'केला (रोबस्टा)' },
    'Barley (Jau)': { en: 'Barley (Jau)', te: 'బార్లీ (జౌ)', hi: 'जौ' },
    'Coffee (Arabica / Robusta)': { en: 'Coffee (Arabica / Robusta)', te: 'కాఫీ (అరబికా / రోబస్టా)', hi: 'कॉफी (अरबिका / रोबस्टा)' },
    'Cotton (Medium Staple)': { en: 'Cotton (Medium Staple)', te: 'పత్తి (మీడియం స్టేపుల్)', hi: 'कपास (मीडियम स्टेपल)' },
    'Cumin Seeds (Jeera)': { en: 'Cumin Seeds (Jeera)', te: 'జీలకర్ర', hi: 'जीरा' },
    'Garlic (Lahsun)': { en: 'Garlic (Lahsun)', te: 'వెల్లుల్లి', hi: 'लहसुन' },
    'Ginger (Adrak)': { en: 'Ginger (Adrak)', te: 'అల్లం', hi: 'अदरक' },
    'Gram (Chana / Chickpea)': { en: 'Gram (Chana / Chickpea)', te: 'శనగలు', hi: 'चना' },
    'Green Gram (Moong)': { en: 'Green Gram (Moong)', te: 'పెసలు', hi: 'मूंग' },
    'Groundnut (Peanut)': { en: 'Groundnut (Peanut)', te: 'వేరుశెనగ', hi: 'मूंगफली' },
    'Jowar (Sorghum)': { en: 'Jowar (Sorghum)', te: 'జొన్నలు', hi: 'ज्वार' },
    'Jute (Raw Jute)': { en: 'Jute (Raw Jute)', te: 'జనపనార', hi: 'जूट' },
    'Litchi (Shahi)': { en: 'Litchi (Shahi)', te: 'లిచ్చి (షాహీ)', hi: 'लीची (शाही)' },
    'Maize (Kharif)': { en: 'Maize (Kharif)', te: 'మొక్కజొన్న (ఖరీఫ్)', hi: 'मक्का (खरीफ)' },
    'Mango (Alphonso / Kesar)': { en: 'Mango (Alphonso / Kesar)', te: 'మామిడి (అల్ఫోన్సో / కేసర్)', hi: 'आम (अल्फांसो / केसरी)' },
    'Mustard (Black)': { en: 'Mustard (Black)', te: 'ఆవాలు (నల్ల)', hi: 'सरसों (काली)' },
    'Onion (Red Nashik)': { en: 'Onion (Red Nashik)', te: 'ఉల్లిపాయ (ఎరుపు నాసిక్)', hi: 'प्याज़ (लाल नासिक)' },
    'Paddy (Basmati)': { en: 'Paddy (Basmati)', te: 'వరి (బాస్మతి)', hi: 'धान (बासमती)' },
    'Potato (Jyoti)': { en: 'Potato (Jyoti)', te: 'బంగాళాదుంప (జ్యోతి)', hi: 'आलू (ज्योति)' },

    // Remaining 8 Mandi database benchmark crops
    'Wheat (Sharbati)': { en: 'Wheat (Sharbati)', te: 'గోధుమ (శర్బతి)', hi: 'गेहूं (शरबती)' },
    'Tomato (Hybrid)': { en: 'Tomato (Hybrid)', te: 'టమాటా (హైబ్రిడ్)', hi: 'टमाटर (हाइब्रिड)' },
    'Sugarcane': { en: 'Sugarcane', te: 'చెరకు', hi: 'गन्ना' },
    'Red Chilli (Guntur)': { en: 'Red Chilli (Guntur)', te: 'ఎర్ర మిర్చి (గుంటూరు)', hi: 'लाल मिर्च (गुंटूर)' },
    'Soybean (Yellow)': { en: 'Soybean (Yellow)', te: 'సోయాబీన్ (పసుపు)', hi: 'सोयाबीन (पीला)' },
    'Tur Dal (Arhar / Pigeon Pea)': { en: 'Tur Dal (Arhar / Pigeon Pea)', te: 'కందిపప్పు (అర్హర్)', hi: 'अरहर दाल (तुअर)' },
    'Turmeric (Haldi)': { en: 'Turmeric (Haldi)', te: 'పసుపు', hi: 'हल्दी' },
    'Tea (Assam Green Leaf)': { en: 'Tea (Assam Green Leaf)', te: 'టీ (అస్సాం గ్రీన్ లీఫ్)', hi: 'चाय (असम हरी पत्ती)' },

    // Base and common crop names & variants
    'Tomato': { en: 'Tomato', te: 'టమాటా', hi: 'टमाटर' },
    'Wheat': { en: 'Wheat', te: 'గోధుమ', hi: 'गेहूं' },
    'Onion': { en: 'Onion', te: 'ఉల్లిపాయ', hi: 'प्याज़' },
    'Potato': { en: 'Potato', te: 'బంగాళాదుంప', hi: 'आलू' },
    'Paddy': { en: 'Paddy', te: 'వరి', hi: 'धान' },
    'Rice': { en: 'Rice', te: 'వరి', hi: 'चावल' },
    'Paddy (Rice)': { en: 'Paddy (Rice)', te: 'వరి (బియ్యం)', hi: 'धान (चावल)' },
    'Cotton': { en: 'Cotton', te: 'పత్తి', hi: 'कपास' },
    'Soybean': { en: 'Soybean', te: 'సోయాబీన్', hi: 'सोयाबीन' },
    'Maize': { en: 'Maize', te: 'మొక్కజొన్న', hi: 'मक्का' },
    'Corn': { en: 'Corn', te: 'మొక్కజొన్న', hi: 'मक्का' },
    'Mustard': { en: 'Mustard', te: 'ఆవాలు', hi: 'सरसों' },
    'Green Gram': { en: 'Green Gram', te: 'పెసలు', hi: 'मूंग' },
    'Moong': { en: 'Moong', te: 'పెసలు', hi: 'मूंग' },
    'Red Chilli': { en: 'Red Chilli', te: 'ఎర్ర మిర్చి', hi: 'लाल मिर्च' },
    'Chilli': { en: 'Chilli', te: 'మిర్చి', hi: 'मिर्च' },
    'Gram (Chana)': { en: 'Gram (Chana)', te: 'శనగలు', hi: 'चना' },
    'Gram': { en: 'Gram', te: 'శనగలు', hi: 'चना' },
    'Chana': { en: 'Chana', te: 'శనగలు', hi: 'चना' },
    'Chickpea': { en: 'Chickpea', te: 'శనగలు', hi: 'चना' },
    'Tur Dal (Arhar)': { en: 'Tur Dal (Arhar)', te: 'కందిపప్పు (అర్హర్)', hi: 'अरहर दाल' },
    'Tur Dal': { en: 'Tur Dal', te: 'కందిపప్పు', hi: 'अरहर दाल' },
    'Tur': { en: 'Tur', te: 'కందిపప్పు', hi: 'तुअर' },
    'Arhar': { en: 'Arhar', te: 'కందిపప్పు', hi: 'अरहर' },
    'Groundnut': { en: 'Groundnut', te: 'వేరుశెనగ', hi: 'मूंगफली' },
    'Peanut': { en: 'Peanut', te: 'వేరుశెనగ', hi: 'मूंगफली' },
    'Turmeric': { en: 'Turmeric', te: 'పసుపు', hi: 'हल्दी' },
    'Haldi': { en: 'Haldi', te: 'పసుపు', hi: 'हल्दी' },
    'Cumin': { en: 'Cumin', te: 'జీలకర్ర', hi: 'जीरा' },
    'Cumin (Jeera)': { en: 'Cumin (Jeera)', te: 'జీలకర్ర', hi: 'जीरा' },
    'Jeera': { en: 'Jeera', te: 'జీలకర్ర', hi: 'जीरा' },
    'Banana': { en: 'Banana', te: 'అరటి', hi: 'केला' },
    'Apple': { en: 'Apple', te: 'ఆపిల్', hi: 'सेब' },
    'Mango': { en: 'Mango', te: 'మామిడి', hi: 'आम' },
    'Jute': { en: 'Jute', te: 'జనపనార', hi: 'जूट' },
    'Tea': { en: 'Tea', te: 'టీ', hi: 'चाय' },
    'Arecanut': { en: 'Arecanut', te: 'వక్క', hi: 'सुपारी' },
    'Supari': { en: 'Supari', te: 'వక్క', hi: 'सुपारी' },
    'Coffee': { en: 'Coffee', te: 'కాఫీ', hi: 'कॉफी' },
    'Garlic': { en: 'Garlic', te: 'వెల్లుల్లి', hi: 'लहसुन' },
    'Lahsun': { en: 'Lahsun', te: 'వెల్లుల్లి', hi: 'लहसुन' },
    'Ginger': { en: 'Ginger', te: 'అల్లం', hi: 'अदरक' },
    'Adrak': { en: 'Adrak', te: 'అల్లం', hi: 'अदरक' },
    'Barley': { en: 'Barley', te: 'బార్లీ', hi: 'जौ' },
    'Jau': { en: 'Jau', te: 'బార్లీ', hi: 'जौ' },
    'Jowar': { en: 'Jowar', te: 'జొన్నలు', hi: 'ज्वार' },
    'Sorghum': { en: 'Sorghum', te: 'జొన్నలు', hi: 'ज्वार' },
    'Bajra': { en: 'Bajra', te: 'సజ్జలు', hi: 'बाजरा' },
    'Pearl Millet': { en: 'Pearl Millet', te: 'సజ్జలు', hi: 'बाजरा' },
    'Litchi': { en: 'Litchi', te: 'లిచ్చి', hi: 'लीची' }
  };

  // Build index for bidirectional lookup across languages
  const CROP_LOOKUP = new Map();
  for (const [key, obj] of Object.entries(CROP_TRANSLATIONS)) {
    CROP_LOOKUP.set(key.toLowerCase().trim(), obj);
    if (obj.en) CROP_LOOKUP.set(obj.en.toLowerCase().trim(), obj);
    if (obj.te) CROP_LOOKUP.set(obj.te.toLowerCase().trim(), obj);
    if (obj.hi) CROP_LOOKUP.set(obj.hi.toLowerCase().trim(), obj);
  }

  // Register common synonyms and dialect variants in CROP_LOOKUP
  const SYNONYM_ALIASES = [
    ['యాపిల్ (రాయల్ డెలిషియస్)', 'Apple (Royal Delicious)'],
    ['యాపిల్', 'Apple'],
    ['పోకచెక్క (సుపారీ)', 'Arecanut (Supari)'],
    ['పోకచెక్క', 'Arecanut (Supari)'],
    ['సజ్జలు (బాజ్రా)', 'Bajra (Pearl Millet)'],
    ['బాజ్రా', 'Bajra (Pearl Millet)'],
    ['పత్తి (మధ్యస్థ పోగు)', 'Cotton (Medium Staple)'],
    ['కపాస్ (మధ్యమ స్టేపల్)', 'Cotton (Medium Staple)'],
    ['కపాస్ (మీడియం స్టేపల్)', 'Cotton (Medium Staple)'],
    ['కపాస్', 'Cotton'],
    ['శనగలు (చనా)', 'Gram (Chana / Chickpea)'],
    ['చనా (ఛోలా)', 'Gram (Chana / Chickpea)'],
    ['పెసలు (మూంగ్)', 'Green Gram (Moong)'],
    ['మూంగ్ (హరా చనా)', 'Green Gram (Moong)'],
    ['వేరుశనగ (పల్లీ)', 'Groundnut (Peanut)'],
    ['పల్లీ', 'Groundnut (Peanut)'],
    ['వేరుశనగ', 'Groundnut (Peanut)'],
    ['జొన్నలు (జ్వార్)', 'Jowar (Sorghum)'],
    ['జ్వార్', 'Jowar (Sorghum)'],
    ['కచ్చా జూట్', 'Jute (Raw Jute)'],
    ['కచ్చా జూట్', 'Jute (Raw Jute)'],
    ['లిచీ (షాహీ)', 'Litchi (Shahi)'],
    ['లిచీ', 'Litchi (Shahi)'],
    ['మామిడి (ఆల్ఫోన్సో / కేసర్)', 'Mango (Alphonso / Kesar)'],
    ['ఆవాలు (నలుపు)', 'Mustard (Black)']
  ];
  for (const [alias, canonical] of SYNONYM_ALIASES) {
    const entry = CROP_TRANSLATIONS[canonical];
    if (entry) {
      CROP_LOOKUP.set(alias.toLowerCase().trim(), entry);
    }
  }

  function tCrop(cropName, targetLang) {
    const lang = targetLang || getLanguage();
    if (!cropName || typeof cropName !== 'string') return cropName || '';
    const rawTrimmed = cropName.trim();
    if (!rawTrimmed) return '';

    // Handle leading emoji or icon symbol, e.g. "🥔 Potato (Jyoti)" or "🌾 Wheat"
    const emojiMatch = rawTrimmed.match(/^([\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]|\p{Extended_Pictographic}|\s)+/u);
    let prefix = '';
    let textToTranslate = rawTrimmed;
    if (emojiMatch && emojiMatch[0]) {
      prefix = emojiMatch[0];
      textToTranslate = rawTrimmed.slice(prefix.length).trim();
    }

    const lower = textToTranslate.toLowerCase();

    // 1. Direct match
    if (CROP_LOOKUP.has(lower)) {
      const entry = CROP_LOOKUP.get(lower);
      const res = entry[lang] || entry['en'] || textToTranslate;
      return prefix ? `${prefix}${res}` : res;
    }

    // 2. Try matching base crop if parentheses suffix exists, e.g. "Tomato (Special)"
    const parenIdx = textToTranslate.indexOf('(');
    if (parenIdx > 0) {
      const base = textToTranslate.substring(0, parenIdx).trim();
      const parenContent = textToTranslate.substring(parenIdx);
      const baseLower = base.toLowerCase();
      if (CROP_LOOKUP.has(baseLower)) {
        const entry = CROP_LOOKUP.get(baseLower);
        const translatedBase = entry[lang] || entry['en'] || base;
        const res = `${translatedBase} ${parenContent}`;
        return prefix ? `${prefix}${res}` : res;
      }
    }

    return rawTrimmed;
  }

  function getStoredLanguage() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
    return DEFAULT_LANG;
  }

  function getLanguage() {
    return getStoredLanguage();
  }

  function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      lang = DEFAULT_LANG;
    }
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
    updateSwitchUI(lang);
    translatePage(lang);

    if (window.AgriTicker && typeof window.AgriTicker.translateTickerItems === 'function') {
      window.AgriTicker.translateTickerItems(lang);
    }

    // Broadcast change event
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  function t(key, fallback = '') {
    const lang = getLanguage();
    if (TRANSLATIONS[lang] && TRANSLATIONS[lang][key] !== undefined) {
      return TRANSLATIONS[lang][key];
    }
    if (TRANSLATIONS[DEFAULT_LANG] && TRANSLATIONS[DEFAULT_LANG][key] !== undefined) {
      return TRANSLATIONS[DEFAULT_LANG][key];
    }
    return fallback || key;
  }

  function tStatus(status) {
    if (!status) return '';
    const clean = String(status).toLowerCase().replace(/\s+/g, '_');
    const key = 'status_' + clean;
    return t(key, status);
  }

  function updateSwitchUI(lang) {
    const wrappers = document.querySelectorAll('.lang-switch-wrapper');
    wrappers.forEach(w => {
      w.setAttribute('data-active-lang', lang);
      w.querySelectorAll('.lang-btn').forEach(btn => {
        const btnLang = btn.getAttribute('data-lang');
        if (btnLang === lang) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    });
  }

  function translatePage(lang) {
    const activeLang = lang || getLanguage();
    const dict = TRANSLATIONS[activeLang] || TRANSLATIONS[DEFAULT_LANG];

    // 1. Text content / HTML
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        if (dict[key].includes('<') && dict[key].includes('>')) {
          el.innerHTML = dict[key];
        } else {
          el.textContent = dict[key];
        }
      }
    });

    // 2. Placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key] !== undefined) {
        el.setAttribute('placeholder', dict[key]);
      }
    });

    // 3. Titles / tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key] !== undefined) {
        el.setAttribute('title', dict[key]);
      }
    });

    // 4. Aria labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      if (dict[key] !== undefined) {
        el.setAttribute('aria-label', dict[key]);
      }
    });

    // 5. Submit inputs
    document.querySelectorAll('input[type="submit"][data-i18n-value], input[type="button"][data-i18n-value]').forEach(el => {
      const key = el.getAttribute('data-i18n-value');
      if (dict[key] !== undefined) {
        el.value = dict[key];
      }
    });

    // 6. Status labels tagged with data-i18n-status
    document.querySelectorAll('[data-i18n-status]').forEach(el => {
      const status = el.getAttribute('data-i18n-status');
      if (status) {
        el.textContent = tStatus(status);
      }
    });

    // 7. Ticker labels and badges
    const tickerLabel = dict['ticker_live_mandi'] || '🔴 LIVE MANDI';
    document.querySelectorAll('.ticker-strip-wrapper').forEach(w => {
      w.setAttribute('data-ticker-label', tickerLabel);
    });
    document.querySelectorAll('.ticker-badge, #ticker-badge').forEach(b => {
      b.textContent = tickerLabel;
    });

    // 8. Elements tagged with data-crop-raw (ticker, cards, history, queue, chips)
    document.querySelectorAll('[data-crop-raw]').forEach(el => {
      const raw = el.getAttribute('data-crop-raw');
      if (raw) {
        el.textContent = tCrop(raw, activeLang);
      }
    });

    // Also update any live scrolling marquee ticker items synchronously
    if (window.AgriTicker && typeof window.AgriTicker.translateTickerItems === 'function') {
      window.AgriTicker.translateTickerItems(activeLang);
    }

    // 9. Optgroups in crop selects
    document.querySelectorAll('optgroup[data-i18n-optgroup]').forEach(og => {
      const key = og.getAttribute('data-i18n-optgroup');
      if (dict[key]) {
        og.label = dict[key];
      }
    });

    // 10. Options in crop-select dropdown (preserving value attribute)
    document.querySelectorAll('#crop-select option[data-crop-raw]').forEach(opt => {
      const raw = opt.getAttribute('data-crop-raw');
      const icon = opt.getAttribute('data-crop-icon') || '';
      const price = opt.getAttribute('data-crop-price') || '';
      const translatedCrop = tCrop(raw, activeLang);
      opt.textContent = `${icon ? icon + ' ' : ''}${translatedCrop}${price ? ' ' + price : ''}`;
    });

    // 11. Options in mandi-crops-datalist
    document.querySelectorAll('#mandi-crops-datalist option[data-crop-raw]').forEach(opt => {
      const raw = opt.getAttribute('data-crop-raw');
      opt.label = tCrop(raw, activeLang);
    });
  }

  // Initial setup
  const initialLang = getStoredLanguage();
  document.documentElement.lang = initialLang;

  document.addEventListener('DOMContentLoaded', () => {
    updateSwitchUI(initialLang);
    translatePage(initialLang);
  });

  window.AgriLang = {
    getLanguage,
    setLanguage,
    t,
    tStatus,
    tCrop,
    CROP_TRANSLATIONS,
    translatePage,
    updateSwitchUI,
    TRANSLATIONS
  };
})();
