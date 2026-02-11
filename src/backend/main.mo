import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Float "mo:core/Float";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public query func healthCheck() : async Text {
    "trader-journal-backend-v0.1.0";
  };

  type LockedAdmins = Map.Map<Principal, Time.Time>;

  let lockedAdmins = Map.empty<Principal, Time.Time>();

  // Store the admin unlock password (in production, this should be set during deployment)
  // For security, this should be a hashed value, but for simplicity we use plain text
  // In a real system, use proper password hashing
  stable var adminUnlockPassword : Text = "YugArorA@12";

  public type SubscriptionPlan = {
    #basic;
    #pro;
    #premium;
  };

  type MistakeCategory = {
    #riskManagement;
    #positionSizing;
    #emotionalControl;
    #tradeTiming;
    #overtrading;
  };

  public type SubscriptionState = {
    plan : ?SubscriptionPlan;
    trialStart : Time.Time;
    paidStart : ?Time.Time;
    trialActive : Bool;
  };

  type TradeEntry = {
    tradeDate : Time.Time;
    session : Text;
    tradingPair : Text;
    stopLoss : Float;
    takeProfit : Float;
    riskReward : Float;
    riskAmount : Float;
    outcome : Bool;
  };

  type Suggestion = {
    category : Text;
    suggestion : Text;
  };

  type MistakeEntry = {
    id : Nat;
    category : MistakeCategory;
    description : Text;
    tradeDate : Time.Time;
    suggestion : Suggestion;
  };

  public type UserProfile = {
    fullName : Text;
    username : Text;
    dateJoined : Time.Time;
    userId : Nat;
  };

  public type PaymentMethod = {
    id : Nat;
    name : Text;
    description : Text;
    enabled : Bool;
  };

  public type Discount = {
    id : Nat;
    code : Text;
    percentage : Float;
    validUntil : Time.Time;
    enabled : Bool;
  };

  type PendingPayment = {
    user : Principal;
    plan : SubscriptionPlan;
    couponCode : ?Text;
    pointsRedeemed : Nat;
    finalAmount : Nat;
    transactionId : Text;
    fileType : Text;
    fileSize : Nat;
    paymentProof : [Nat8];
    submittedAt : Time.Time;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let tradeEntries = Map.empty<Principal, List.List<TradeEntry>>();
  let mistakeEntries = Map.empty<Principal, List.List<MistakeEntry>>();
  let subscriptions = Map.empty<Principal, SubscriptionState>();
  let paymentMethods = Map.empty<Nat, PaymentMethod>();
  let discounts = Map.empty<Nat, Discount>();
  let pendingPayments = Map.empty<Principal, PendingPayment>();

  var nextUserId = 1;
  var nextPaymentMethodId = 1;
  var nextDiscountId = 1;

  var paymentQRCode : ?Storage.ExternalBlob = null;

  public shared ({ caller }) func uploadPaymentQRCode(blob : Storage.ExternalBlob) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can upload the payment QR code");
    };
    paymentQRCode := ?blob;
  };

  public shared ({ caller }) func clearPaymentQRCode() : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can clear the payment QR code");
    };
    paymentQRCode := null;
  };

  // Public endpoint - accessible to guests considering subscription
  public query func ensureHasUserAndGetPaymentQRCode() : async ?Storage.ExternalBlob {
    paymentQRCode;
  };

  // Public endpoint - accessible to guests considering subscription
  public query ({ caller }) func ensureHasUserAndGetSubscriptionState() : async ?SubscriptionState {
    subscriptions.get(caller);
  };

  // Helper function to check if caller is authorized as admin (permanent or temporary)
  func isAuthorizedAdmin(caller : Principal) : Bool {
    // Check permanent admin role
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    // Check temporary unlock
    switch (lockedAdmins.get(caller)) {
      case (?expireTime) {
        Time.now() < expireTime;
      };
      case (null) { false };
    };
  };

  // Helper function to check subscription status
  func getSubscriptionStatus(caller : Principal) : {
    #trial;
    #paid : SubscriptionPlan;
    #expired;
    #none;
  } {
    switch (subscriptions.get(caller)) {
      case (null) { #none };
      case (?sub) {
        let now = Time.now();
        let trialActive = sub.trialActive and (now - sub.trialStart < (172_800_000_000_000 : Time.Time)); // 2 days

        if (trialActive) {
          #trial;
        } else {
          switch (sub.plan, sub.paidStart) {
            case (?plan, ?paidStart) {
              if (now - paidStart < (2_678_400_000_000_000 : Time.Time)) {
                // 31 days in nanoseconds
                #paid(plan);
              } else { #expired };
            };
            case (_, _) { #expired };
          };
        };
      };
    };
  };

  // Helper function to check if user has access to basic features (journal)
  func hasBasicAccess(caller : Principal) : Bool {
    switch (getSubscriptionStatus(caller)) {
      case (#trial) { true };
      case (#paid(_)) { true };
      case (#expired) { false };
      case (#none) { false };
    };
  };

  // Helper function to check if user has access to pro features (mistakes tracking)
  func hasProAccess(caller : Principal) : Bool {
    switch (getSubscriptionStatus(caller)) {
      case (#trial) { true };
      case (#paid(#pro)) { true };
      case (#paid(#premium)) { true };
      case (#paid(#basic)) { false };
      case (#expired) { false };
      case (#none) { false };
    };
  };

  // Helper function to check if user has access to premium features (analytics)
  func hasPremiumAccess(caller : Principal) : Bool {
    switch (getSubscriptionStatus(caller)) {
      case (#trial) { true };
      case (#paid(#premium)) { true };
      case (#paid(#pro)) { false };
      case (#paid(#basic)) { false };
      case (#expired) { false };
      case (#none) { false };
    };
  };

  // Admin role management - uses AccessControl.assignRole which has built-in admin check
  public shared ({ caller }) func grantAdminRole(target : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can grant admin roles");
    };
    // AccessControl.assignRole already includes admin-only guard
    AccessControl.assignRole(accessControlState, caller, target, #admin);
  };

  public shared ({ caller }) func revokeAdminRole(target : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can revoke admin roles");
    };
    // AccessControl.assignRole already includes admin-only guard
    AccessControl.assignRole(accessControlState, caller, target, #user);
  };

  public query ({ caller }) func getAllUsersWithIds() : async [(Principal, UserProfile)] {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can fetch all users");
    };
    userProfiles.toArray();
  };

  public query ({ caller }) func findUserById(targetId : Nat) : async ?(Principal, UserProfile) {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can search users by ID");
    };

    for ((principal, profile) in userProfiles.entries()) {
      if (profile.userId == targetId) {
        return ?(principal, profile);
      };
    };
    null;
  };

  public query ({ caller }) func isUserRegistered(user : Principal) : async Bool {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can check user registration status");
    };

    switch (userProfiles.get(user)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query ({ caller }) func getAllUserData() : async [(Principal, UserProfile, [TradeEntry], [MistakeEntry], ?SubscriptionState)] {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all user data");
    };

    userProfiles.toArray().map<(
      Principal,
      UserProfile,
    ), (
      Principal,
      UserProfile,
      [TradeEntry],
      [MistakeEntry],
      ?SubscriptionState,
    )>(
      func(entry) {
        let (principal, profile) = entry;
        let trades = switch (tradeEntries.get(principal)) {
          case (null) { List.empty<TradeEntry>() };
          case (?t) { t };
        };
        let mistakes = switch (mistakeEntries.get(principal)) {
          case (null) { List.empty<MistakeEntry>() };
          case (?m) { m };
        };

        (
          principal,
          profile,
          trades.toArray(),
          mistakes.toArray(),
          subscriptions.get(principal),
        );
      }
    );
  };

  // Admin: Activate subscription plan for a specific user
  public shared ({ caller }) func adminActivateSubscription(user : Principal, plan : SubscriptionPlan) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can activate subscriptions for users");
    };

    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("User does not exist");
      };
      case (?_) {
        let currentSub = subscriptions.get(user);
        let newSubscription : SubscriptionState = {
          plan = ?plan;
          trialStart = switch (currentSub) {
            case (?sub) { sub.trialStart };
            case (null) { Time.now() };
          };
          paidStart = ?Time.now();
          trialActive = false;
        };
        subscriptions.add(user, newSubscription);
      };
    };
  };

  // Admin: Cancel/deactivate subscription for a specific user
  public shared ({ caller }) func adminCancelSubscription(user : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can cancel subscriptions for users");
    };

    switch (subscriptions.get(user)) {
      case (null) {
        Runtime.trap("User does not have a subscription");
      };
      case (?sub) {
        let canceledSubscription : SubscriptionState = {
          plan = null;
          trialStart = sub.trialStart;
          paidStart = null;
          trialActive = false;
        };
        subscriptions.add(user, canceledSubscription);
      };
    };
  };

  // Admin: Kick out/remove a specific user
  public shared ({ caller }) func adminRemoveUser(user : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can remove users");
    };

    switch (userProfiles.get(user)) {
      case (null) {
        Runtime.trap("User does not exist");
      };
      case (?_) {
        userProfiles.remove(user);
        tradeEntries.remove(user);
        mistakeEntries.remove(user);
        subscriptions.remove(user);
      };
    };
  };

  // Admin: Create payment method
  public shared ({ caller }) func adminCreatePaymentMethod(name : Text, description : Text) : async PaymentMethod {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can create payment methods");
    };

    let newMethod : PaymentMethod = {
      id = nextPaymentMethodId;
      name;
      description;
      enabled = true;
    };
    paymentMethods.add(nextPaymentMethodId, newMethod);
    nextPaymentMethodId += 1;
    newMethod;
  };

  // Admin: Update payment method
  public shared ({ caller }) func adminUpdatePaymentMethod(id : Nat, name : Text, description : Text, enabled : Bool) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update payment methods");
    };

    switch (paymentMethods.get(id)) {
      case (null) {
        Runtime.trap("Payment method not found");
      };
      case (?_) {
        let updatedMethod : PaymentMethod = {
          id;
          name;
          description;
          enabled;
        };
        paymentMethods.add(id, updatedMethod);
      };
    };
  };

  // Admin: Delete payment method
  public shared ({ caller }) func adminDeletePaymentMethod(id : Nat) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete payment methods");
    };

    switch (paymentMethods.get(id)) {
      case (null) {
        Runtime.trap("Payment method not found");
      };
      case (?_) {
        paymentMethods.remove(id);
      };
    };
  };

  // Admin: Get all payment methods
  public query ({ caller }) func adminGetAllPaymentMethods() : async [PaymentMethod] {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all payment methods");
    };

    paymentMethods.values().toArray();
  };

  // Admin: Create discount
  public shared ({ caller }) func adminCreateDiscount(code : Text, percentage : Float, validUntil : Time.Time) : async Discount {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can create discounts");
    };

    let newDiscount : Discount = {
      id = nextDiscountId;
      code;
      percentage;
      validUntil;
      enabled = true;
    };
    discounts.add(nextDiscountId, newDiscount);
    nextDiscountId += 1;
    newDiscount;
  };

  // Admin: Update discount
  public shared ({ caller }) func adminUpdateDiscount(id : Nat, code : Text, percentage : Float, validUntil : Time.Time, enabled : Bool) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can update discounts");
    };

    switch (discounts.get(id)) {
      case (null) {
        Runtime.trap("Discount not found");
      };
      case (?_) {
        let updatedDiscount : Discount = {
          id;
          code;
          percentage;
          validUntil;
          enabled;
        };
        discounts.add(id, updatedDiscount);
      };
    };
  };

  // Admin: Delete discount
  public shared ({ caller }) func adminDeleteDiscount(id : Nat) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete discounts");
    };

    switch (discounts.get(id)) {
      case (null) {
        Runtime.trap("Discount not found");
      };
      case (?_) {
        discounts.remove(id);
      };
    };
  };

  // Admin: Get all discounts
  public query ({ caller }) func adminGetAllDiscounts() : async [Discount] {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all discounts");
    };

    discounts.values().toArray();
  };

  // ============ USER PROFILE FUNCTIONS ============

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile or admin access required");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createUserProfile(fullName : Text, username : Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create a profile");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        let newProfile : UserProfile = {
          fullName;
          username;
          dateJoined = Time.now();
          userId = nextUserId;
        };
        userProfiles.add(caller, newProfile);

        // Initialize 2-day free trial automatically
        let defaultSubscription : SubscriptionState = {
          plan = null;
          trialStart = Time.now();
          paidStart = null;
          trialActive = true;
        };
        subscriptions.add(caller, defaultSubscription);

        nextUserId += 1;
        newProfile;
      };
      case (?_existingProfile) {
        Runtime.trap("Profile already exists");
      };
    };
  };

  // ============ MISTAKE TRACKING FUNCTIONS ============

  func getLastMistakeId(caller : Principal) : ?Nat {
    switch (mistakeEntries.get(caller)) {
      case (null) { null };
      case (?mistakes) {
        var lastId = 0;
        for (mistake in mistakes.values()) {
          if (mistake.id > lastId) {
            lastId := mistake.id;
          };
        };
        ?lastId;
      };
    };
  };

  func createSuggestion(category : MistakeCategory, description : Text) : Suggestion {
    let detailedSuggestion : Text = switch (category) {
      case (#riskManagement) {
        "Analyze your risk management strategy and ensure it aligns with your trading goals. Consider using stop-loss orders consistently and never risk more than 1-2% of your capital per trade.";
      };
      case (#positionSizing) {
        "Review your position sizing techniques for optimal risk-reward ratio. Calculate position size based on your account size, risk percentage, and stop-loss distance.";
      };
      case (#emotionalControl) {
        "Develop strategies to manage emotions during trades, such as mindfulness or journaling. Take breaks after losses and avoid revenge trading.";
      };
      case (#tradeTiming) {
        "Analyze market trends and timing indicators for better entries and exits. Wait for clear setups and avoid FOMO (fear of missing out).";
      };
      case (#overtrading) {
        "Implement strict trading rules and take deliberate breaks to avoid burnout. Set a maximum number of trades per day and stick to your trading plan.";
      };
    };

    let categoryText = switch (category) {
      case (#riskManagement) { "Risk Management" };
      case (#positionSizing) { "Position Sizing" };
      case (#emotionalControl) { "Emotional Control" };
      case (#tradeTiming) { "Trade Timing" };
      case (#overtrading) { "Overtrading" };
    };

    {
      category = categoryText;
      suggestion = detailedSuggestion # " (Context: " # description # ")";
    };
  };

  public shared ({ caller }) func createMistakeEntry(
    category : MistakeCategory,
    description : Text,
    tradeDate : Time.Time
  ) : async MistakeEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create mistake entries");
    };

    // Mistakes tracking requires Pro or Premium plan (or active trial)
    if (not hasProAccess(caller)) {
      Runtime.trap("Subscription required: Mistakes tracking requires Pro (₹799) or Premium (₹999) plan");
    };

    let id = switch (getLastMistakeId(caller)) {
      case (null) { 1 };
      case (?lastId) { lastId + 1 };
    };

    let suggestion = createSuggestion(category, description);

    let newMistake : MistakeEntry = {
      id;
      category;
      description;
      tradeDate;
      suggestion;
    };

    switch (mistakeEntries.get(caller)) {
      case (?existingEntries) {
        existingEntries.add(newMistake);
      };
      case (null) {
        let newEntryList = List.empty<MistakeEntry>();
        newEntryList.add(newMistake);
        mistakeEntries.add(caller, newEntryList);
      };
    };

    newMistake;
  };

  public query ({ caller }) func getAllMistakes() : async [MistakeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their mistakes");
    };

    // Mistakes tracking requires Pro or Premium plan (or active trial)
    if (not hasProAccess(caller)) {
      Runtime.trap("Subscription required: Mistakes tracking requires Pro (₹799) or Premium (₹999) plan");
    };

    switch (mistakeEntries.get(caller)) {
      case (?entries) { entries.toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func updateMistakeEntry(mistakeId : Nat, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their mistakes");
    };

    // Mistakes tracking requires Pro or Premium plan (or active trial)
    if (not hasProAccess(caller)) {
      Runtime.trap("Subscription required: Mistakes tracking requires Pro (₹799) or Premium (₹999) plan");
    };

    switch (mistakeEntries.get(caller)) {
      case (null) { Runtime.trap("No mistakes found for the user") };
      case (?entries) {
        let entriesArray = entries.toArray();
        var found = false;
        let updatedList = List.empty<MistakeEntry>();

        for (mistake in entriesArray.vals()) {
          if (mistake.id == mistakeId) {
            found := true;
            let updatedSuggestion = createSuggestion(mistake.category, description);
            let updatedMistake : MistakeEntry = {
              id = mistake.id;
              category = mistake.category;
              description;
              tradeDate = mistake.tradeDate;
              suggestion = updatedSuggestion;
            };
            updatedList.add(updatedMistake);
          } else {
            updatedList.add(mistake);
          };
        };

        if (not found) {
          Runtime.trap("Mistake entry not found");
        };

        mistakeEntries.add(caller, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteMistakeEntry(mistakeId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete their mistakes");
    };

    // Mistakes tracking requires Pro or Premium plan (or active trial)
    if (not hasProAccess(caller)) {
      Runtime.trap("Subscription required: Mistakes tracking requires Pro (₹799) or Premium (₹999) plan");
    };

    switch (mistakeEntries.get(caller)) {
      case (null) { Runtime.trap("No mistakes found for the user") };
      case (?entries) {
        let entriesArray = entries.toArray();
        var found = false;
        let newList = List.empty<MistakeEntry>();

        for (mistake in entriesArray.vals()) {
          if (mistake.id == mistakeId) {
            found := true;
          } else {
            newList.add(mistake);
          };
        };

        if (not found) {
          Runtime.trap("Mistake entry not found");
        };

        mistakeEntries.add(caller, newList);
      };
    };
  };

  // ============ TRADE JOURNAL FUNCTIONS ============

  public shared ({ caller }) func createTradeEntry(
    tradeDate : Time.Time,
    session : Text,
    tradingPair : Text,
    stopLoss : Float,
    takeProfit : Float,
    riskReward : Float,
    riskAmount : Float,
    outcome : Bool
  ) : async TradeEntry {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create trade entries");
    };

    // Trade journal requires at least Basic plan (or active trial)
    if (not hasBasicAccess(caller)) {
      Runtime.trap("Subscription required: Trade journal requires Basic (₹299), Pro (₹799), or Premium (₹999) plan");
    };

    let newTrade : TradeEntry = {
      tradeDate;
      session;
      tradingPair;
      stopLoss;
      takeProfit;
      riskReward;
      riskAmount;
      outcome;
    };

    switch (tradeEntries.get(caller)) {
      case (?existingEntries) {
        existingEntries.add(newTrade);
      };
      case (null) {
        let newEntryList = List.empty<TradeEntry>();
        newEntryList.add(newTrade);
        tradeEntries.add(caller, newEntryList);
      };
    };

    newTrade;
  };

  public query ({ caller }) func getAllTrades() : async [TradeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their trades");
    };

    // Trade journal requires at least Basic plan (or active trial)
    if (not hasBasicAccess(caller)) {
      Runtime.trap("Subscription required: Trade journal requires Basic (₹299), Pro (₹799), or Premium (₹999) plan");
    };

    switch (tradeEntries.get(caller)) {
      case (?entries) { entries.toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func updateTradeEntry(index : Nat, entry : TradeEntry) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update their trades");
    };

    // Trade journal requires at least Basic plan (or active trial)
    if (not hasBasicAccess(caller)) {
      Runtime.trap("Subscription required: Trade journal requires Basic (₹299), Pro (₹799), or Premium (₹999) plan");
    };

    switch (tradeEntries.get(caller)) {
      case (null) { Runtime.trap("No trades found for the user") };
      case (?entries) {
        let entriesArray = entries.toArray();

        if (index >= entriesArray.size()) {
          Runtime.trap("Invalid index: " # index.toText() # ". Only " # entriesArray.size().toText() # " entries available");
        };

        let newList = List.empty<TradeEntry>();
        var i = 0;

        for (trade in entriesArray.vals()) {
          if (i == index) {
            newList.add(entry);
          } else {
            newList.add(trade);
          };
          i += 1;
        };

        tradeEntries.add(caller, newList);
      };
    };
  };

  public shared ({ caller }) func deleteTradeEntry(index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete their trades");
    };

    // Trade journal requires at least Basic plan (or active trial)
    if (not hasBasicAccess(caller)) {
      Runtime.trap("Subscription required: Trade journal requires Basic (₹299), Pro (₹799), or Premium (₹999) plan");
    };

    switch (tradeEntries.get(caller)) {
      case (null) { Runtime.trap("No trades found for the user") };
      case (?entries) {
        let entriesArray = entries.toArray();

        if (index >= entriesArray.size()) {
          Runtime.trap("Invalid index: " # index.toText() # ". Only " # entriesArray.size().toText() # " entries available");
        };

        let newList = List.empty<TradeEntry>();
        var i = 0;

        for (trade in entriesArray.vals()) {
          if (i != index) {
            newList.add(trade);
          };
          i += 1;
        };

        tradeEntries.add(caller, newList);
      };
    };
  };

  // ============ ANALYTICS FUNCTIONS ============

  func calculatePL(trade : TradeEntry) : Float {
    if (trade.outcome) {
      trade.riskAmount * trade.riskReward;
    } else {
      -trade.riskAmount;
    };
  };

  func toDay(timestamp : Time.Time) : Time.Time {
    timestamp / 86400_000_000_000;
  };

  public query ({ caller }) func getDailyProfitForDate(date : Time.Time) : async Float {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their analytics");
    };

    // Analytics requires Premium plan (or active trial)
    if (not hasPremiumAccess(caller)) {
      Runtime.trap("Subscription required: Analytics requires Premium (₹999) plan");
    };

    switch (tradeEntries.get(caller)) {
      case (?entries) {
        let targetDay = toDay(date);
        var dailyPL : Float = 0.0;

        for (trade in entries.values()) {
          if (toDay(trade.tradeDate) == targetDay) {
            dailyPL += calculatePL(trade);
          };
        };

        dailyPL;
      };
      case (null) { 0.0 };
    };
  };

  public query ({ caller }) func getTradesByDateRange(startDate : Time.Time, endDate : Time.Time) : async [TradeEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their analytics");
    };

    // Analytics requires Premium plan (or active trial)
    if (not hasPremiumAccess(caller)) {
      Runtime.trap("Subscription required: Analytics requires Premium (₹999) plan");
    };

    switch (tradeEntries.get(caller)) {
      case (?entries) {
        let filtered = List.empty<TradeEntry>();

        for (trade in entries.values()) {
          if (trade.tradeDate >= startDate and trade.tradeDate <= endDate) {
            filtered.add(trade);
          };
        };

        filtered.toArray();
      };
      case (null) { [] };
    };
  };

  public query ({ caller }) func getAnalytics(startDate : ?Time.Time, endDate : ?Time.Time) : async {
    totalTrades : Nat;
    winningTrades : Nat;
    losingTrades : Nat;
    accuracy : Float;
    totalPL : Float;
    grossProfit : Float;
    grossLoss : Float;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their analytics");
    };

    // Analytics requires Premium plan (or active trial)
    if (not hasPremiumAccess(caller)) {
      Runtime.trap("Subscription required: Analytics requires Premium (₹999) plan");
    };

    switch (tradeEntries.get(caller)) {
      case (?entries) {
        var totalTrades = 0;
        var winningTrades = 0;
        var losingTrades = 0;
        var totalPL : Float = 0.0;
        var grossProfit : Float = 0.0;
        var grossLoss : Float = 0.0;

        for (trade in entries.values()) {
          let includeInRange = switch (startDate, endDate) {
            case (null, null) { true };
            case (?start, null) { trade.tradeDate >= start };
            case (null, ?end) { trade.tradeDate <= end };
            case (?start, ?end) { trade.tradeDate >= start and trade.tradeDate <= end };
          };

          if (includeInRange) {
            totalTrades += 1;
            let pl = calculatePL(trade);
            totalPL += pl;

            if (trade.outcome) {
              winningTrades += 1;
              grossProfit += pl;
            } else {
              losingTrades += 1;
              grossLoss += pl;
            };
          };
        };

        let accuracy = if (totalTrades > 0) {
          winningTrades.toFloat() / totalTrades.toFloat();
        } else {
          0.0;
        };

        {
          totalTrades;
          winningTrades;
          losingTrades;
          accuracy;
          totalPL;
          grossProfit;
          grossLoss;
        };
      };
      case (null) {
        {
          totalTrades = 0;
          winningTrades = 0;
          losingTrades = 0;
          accuracy = 0.0;
          totalPL = 0.0;
          grossProfit = 0.0;
          grossLoss = 0.0;
        };
      };
    };
  };

  public query ({ caller }) func getAllTradeDates() : async [Time.Time] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their analytics");
    };

    // Analytics requires Premium plan (or active trial)
    if (not hasPremiumAccess(caller)) {
      Runtime.trap("Subscription required: Analytics requires Premium (₹999) plan");
    };

    switch (tradeEntries.get(caller)) {
      case (?entries) {
        let uniqueDates = Map.empty<Time.Time, Bool>();

        for (trade in entries.values()) {
          let day = toDay(trade.tradeDate);
          uniqueDates.add(day, true);
        };

        uniqueDates.keys().toArray();
      };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func submitPaymentForSubscription(
    plan : SubscriptionPlan,
    couponCode : ?Text,
    pointsRedeemed : Nat,
    finalAmount : Nat,
    transactionId : Text,
    fileType : Text,
    fileSize : Nat,
    paymentProof : [Nat8]
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit payment proofs");
    };

    // Validate that payment file is PDF and less than 8MB (size is checked in frontend)
    if (not fileType.contains(#text "pdf")) {
      Runtime.trap("File must be a PDF");
    };

    if (fileSize > 8_000_000) {
      Runtime.trap("File size must be less than 8MB");
    };

    // Validate if user already has a subscription record
    switch (subscriptions.get(caller)) {
      case (null) {
        Runtime.trap("No subscription record found for user. Please create a profile first.");
      };
      case (?subscription) {
        // Check if payment proof already exists for user
        switch (pendingPayments.get(caller)) {
          case (?_existingPayment) {
            Runtime.trap("You already have a pending payment. Please wait for admin approval before submitting a new one");
          };
          case (null) {
            // Save new payment submission in backend
            let pendingPayment : PendingPayment = {
              user = caller;
              plan;
              couponCode;
              pointsRedeemed;
              finalAmount;
              transactionId;
              fileType;
              fileSize;
              paymentProof;
              submittedAt = Time.now();
            };
            pendingPayments.add(caller, pendingPayment);
          };
        };
      };
    };
  };

  public shared ({ caller }) func adminReviewAndApprovePayment(user : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can review and approve payments");
    };

    switch (pendingPayments.get(user)) {
      case (null) {
        Runtime.trap("No pending payment found for the user");
      };
      case (?payment) {
        // Activate subscription without extension.
        let currentSub = subscriptions.get(user);
        switch (currentSub) {
          case (null) {
            Runtime.trap("No existing subscription found for user. Please create a subscription record before activating a paid plan.");
          };
          case (?sub) {
            let newSubscription : SubscriptionState = {
              plan = ?payment.plan;
              trialStart = sub.trialStart;
              paidStart = ?Time.now(); // Set new paid subscription, always 31 days each
              trialActive = false;
            };
            subscriptions.add(user, newSubscription);
            // Remove payment proof after successful activation
            pendingPayments.remove(user);
          };
        };
      };
    };
  };

  public shared ({ caller }) func adminRejectPayment(user : Principal, reason : Text) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can reject payments");
    };

    switch (pendingPayments.get(user)) {
      case (null) { Runtime.trap("No pending payment found for the user") };
      case (?_payment) {
        pendingPayments.remove(user);
      };
    };
  };

  public query ({ caller }) func adminGetPendingPayments() : async [(Principal, PendingPayment)] {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view pending payments");
    };

    pendingPayments.toArray();
  };

  public query ({ caller }) func adminGetPaymentProof(user : Principal) : async ?[Nat8] {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can retrieve payment proofs");
    };

    switch (pendingPayments.get(user)) {
      case (null) { null };
      case (?payment) { ?payment.paymentProof };
    };
  };

  public shared ({ caller }) func cancelTrial() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can cancel their trial");
    };

    switch (subscriptions.get(caller)) {
      case (null) {
        Runtime.trap("No subscription record found for user");
      };
      case (?sub) {
        if (sub.trialActive and (Time.now() - sub.trialStart < (172_800_000_000_000 : Time.Time))) {
          let updatedSub : SubscriptionState = {
            plan = sub.plan;
            trialStart = sub.trialStart;
            paidStart = sub.paidStart;
            trialActive = false;
          };
          subscriptions.add(caller, updatedSub);
        } else {
          Runtime.trap("Cannot cancel inactive or expired trial");
        };
      };
    };
  };

  public shared ({ caller }) func adminDeletePaymentProof(user : Principal) : async () {
    if (not isAuthorizedAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can delete payment proofs");
    };

    switch (pendingPayments.get(user)) {
      case (null) {
        Runtime.trap("No payment proof found for the user");
      };
      case (?_) {
        pendingPayments.remove(user);
      };
    };
  };

  public query ({ caller }) func getCallerPlan() : async ?{
    #trial;
    #paid : SubscriptionPlan;
    #expired;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their plan");
    };

    switch (subscriptions.get(caller)) {
      case (null) { null };
      case (?sub) {
        let now = Time.now();
        let trialActive = sub.trialActive and (now - sub.trialStart < (172_800_000_000_000 : Time.Time));

        if (trialActive) {
          ?#trial;
        } else {
          switch (sub.plan, sub.paidStart) {
            case (?plan, ?paidStart) {
              if (now - paidStart < (2_678_400_000_000_000 : Time.Time)) {
                // 31 days in nanoseconds
                ?#paid(plan);
              } else { ?#expired };
            };
            case (_, _) { ?#expired };
          };
        };
      };
    };
  };

  public query func getEnabledPaymentMethods() : async [PaymentMethod] {
    paymentMethods.values().toArray().filter(func(method : PaymentMethod) : Bool { method.enabled });
  };

  public query func getActiveDiscounts() : async [Discount] {
    let now = Time.now();
    discounts.values().toArray().filter(
      func(discount : Discount) : Bool {
        discount.enabled and discount.validUntil > now;
      }
    );
  };

  public query ({ caller }) func isLockedAdmin() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check admin lock status");
    };

    switch (lockedAdmins.get(caller)) {
      case (?expireTime) {
        Time.now() < expireTime;
      };
      case (null) { false };
    };
  };

  public shared ({ caller }) func unlockAdmin(password : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unlock admin access");
    };

    // Validate password
    if (password != adminUnlockPassword) {
      Runtime.trap("Invalid password");
    };

    // Grant temporary admin access for 5 minutes
    let expireTime = Time.now() + (5 * 60 * 1_000_000_000);
    lockedAdmins.add(caller, expireTime);
    true;
  };

  // Admin function to update the unlock password
  public shared ({ caller }) func adminSetUnlockPassword(newPassword : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only permanent admins can change the unlock password");
    };

    if (newPassword.size() < 8) {
      Runtime.trap("Password must be at least 8 characters long");
    };

    adminUnlockPassword := newPassword;
  };
};
