Feature: Presentation Tables
  Several SDE tables exist so a client can draw things: meta groups label a
  type's tech level, icons and graphics name the image and model files a
  type points at, skins and skin licences describe ship paint jobs, and
  notification types name the kinds of in-game notification. This feature
  covers those lookups.

  A fitting tool or an inventory viewer holds these IDs from a type record
  or a live notification and resolves them here.

  # ── Meta groups ──────────────────────────────────────────────────────

  Rule: When a meta group ID present in the loaded data set is looked up, the SDE provider shall return the meta group record carrying its name.
    A type's meta group is its tech level — Tech I, Tech II, Faction — and
    the name is what an item list shows beside the type.

    Scenario: Meta group 2 resolves to Tech II
      Given a static data provider with the reference data set
      When I look up meta group 2
      Then the returned record shall be named "Tech II"

  Rule: When every meta group is requested, the SDE provider shall return one record for each loaded meta group.
    The meta group table is small and read whole to build a tech level
    filter.

    Scenario: The two loaded meta groups are both returned
      Given a static data provider with the reference data set
      When I look up every meta group
      Then the result should contain exactly 2 records
      And the result shall be the records named "Tech I, Tech II"

  # ── Icons and graphics ───────────────────────────────────────────────

  Rule: When an icon ID present in the loaded data set is looked up, the SDE provider shall return the icon record carrying its icon file path.
    Types, groups and market groups name an icon by ID; the record gives
    the resource path of the image to draw.

    Scenario: Icon 22 resolves to its image file
      Given a static data provider with the reference data set
      When I look up icon 22
      Then the returned record shall carry the icon file "res:/UI/Texture/Icons/22_32_2.png"

  Rule: When a graphic ID present in the loaded data set is looked up, the SDE provider shall return the graphic record carrying its graphic file path.
    A type names its 3D model by graphic ID; the record gives the resource
    path of the model.

    Scenario: Graphic 20 resolves to its model file
      Given a static data provider with the reference data set
      When I look up graphic 20
      Then the returned record shall carry the graphic file "res:/dx9/model/worldobject/asteroid/oreveld001.red"

  # ── Skins ────────────────────────────────────────────────────────────

  Rule: When a skin ID present in the loaded data set is looked up, the SDE provider shall return the skin record carrying its internal name.
    A skin is a paint job for one or more hulls; the internal name is the
    label the SDE gives it.

    Scenario: Skin 1 resolves to Tristan Sanctuary
      Given a static data provider with the reference data set
      When I look up skin 1
      Then the returned record shall carry the internal name "Tristan Sanctuary"

  Rule: When a skin licence type ID present in the loaded data set is looked up, the SDE provider shall return the licence record carrying its skin ID and its duration.
    The licence is the market item that grants a skin; its type ID is what a
    market order carries, and the duration says whether it is permanent.

    Scenario: Licence 34599 grants skin 1 permanently
      Given a static data provider with the reference data set
      When I look up skin license 34599
      Then the returned record shall carry skin 1
      And the returned record shall carry duration -1

  Rule: When the skin licences of a skin are requested, the SDE provider shall return every loaded licence whose skin ID equals that skin, and an empty list for a skin with none loaded.
    A skin page lists the licences that grant it; a skin with no licence
    loaded answers with an empty list.

    Scenario: Skin 1 has two licences
      Given a static data provider with the reference data set
      When I look up skin licenses of skin 1
      Then the result should contain exactly 2 records
      And each returned record shall carry skin 1

    Scenario: Skin 2 has no licences loaded
      Given a static data provider with the reference data set
      When I look up skin licenses of skin 2
      Then the provider shall return an empty list

  # ── Notification types ───────────────────────────────────────────────

  Rule: When a notification type ID present in the loaded data set is looked up, the SDE provider shall return the notification type record carrying its display name and its internal name.
    A live notification carries a type ID; the record gives the display name
    a client shows and the internal name the game code uses.

    Scenario: Notification type 1 resolves to Old Notification
      Given a static data provider with the reference data set
      When I look up notification type 1
      Then the returned record shall carry the display name "Old Notification"
      And the returned record shall carry the internal name "notificationTypeOldNotification"

  # ── Absent identifiers ───────────────────────────────────────────────

  Rule: If a meta group, icon, graphic, skin, skin licence or notification type ID is absent from the loaded data set, then the SDE provider shall return null.
    Icon and graphic IDs on a type record may be null or point at a
    resource an extract left out; null is the answer for a record that is
    not loaded.

    Scenario: Unknown meta group 99 resolves to null
      Given a static data provider with the reference data set
      When I look up meta group 99
      Then the provider shall return null

    Scenario: Unknown icon 99 resolves to null
      Given a static data provider with the reference data set
      When I look up icon 99
      Then the provider shall return null

    Scenario: Unknown graphic 99 resolves to null
      Given a static data provider with the reference data set
      When I look up graphic 99
      Then the provider shall return null

    Scenario: Unknown skin 99 resolves to null
      Given a static data provider with the reference data set
      When I look up skin 99
      Then the provider shall return null

    Scenario: Unknown skin licence 99 resolves to null
      Given a static data provider with the reference data set
      When I look up skin license 99
      Then the provider shall return null

    Scenario: Unknown notification type 99 resolves to null
      Given a static data provider with the reference data set
      When I look up notification type 99
      Then the provider shall return null
