import { User } from '../models/User';
import { lookupRequestGeoLocation } from '../services/geoip.service';

export const locationResolvers = {
  Query: {
    getMyIpGeolocation: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');

      const result = await lookupRequestGeoLocation(context?.req);

      // Auto-save the IP-detected location to the user's record so they appear on the map
      if (result.latitude != null && result.longitude != null) {
        try {
          await User.findByIdAndUpdate(context.user.id, {
            latitude: result.latitude,
            longitude: result.longitude,
            location: [result.city, result.country].filter(Boolean).join(', '),
            locationUpdatedAt: new Date(),
            locationShared: false, // IP-detected, not user-confirmed
          });
        } catch (saveErr) {
          console.debug('[getMyIpGeolocation] Failed to save location:', saveErr);
        }
      }

      return {
        latitude: result.latitude ?? null,
        longitude: result.longitude ?? null,
        city: result.city ?? null,
        country: result.country ?? null,
      };
    },
    usersWithLocation: async (_: any, { role }: { role?: string }, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      // Return ALL users (not just those with coordinates)
      const filter: any = {
        isDeleted: { $ne: true },
      };
      if (role) filter.role = role;
      const users = await User.find(filter).select(
        'id username email role fullName avatar phone location latitude longitude locationUpdatedAt locationShared locationDenied title'
      );
      return users.map((u: any) => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        avatar: u.avatar,
        phone: u.phone,
        location: u.location,
        latitude: u.latitude ?? null,
        longitude: u.longitude ?? null,
        locationUpdatedAt: u.locationUpdatedAt?.toISOString(),
        locationShared: u.locationShared ?? false,
        locationDenied: u.locationDenied ?? false,
        title: u.title,
      }));
    },
  },
  Mutation: {
    updateUserLocation: async (_: any, { latitude, longitude }: any, context: any) => {
      if (!context.user) throw new Error('Not authenticated');
      const user = await User.findByIdAndUpdate(
        context.user.id,
        {
          latitude,
          longitude,
          locationUpdatedAt: new Date(),
          locationShared: true,
        },
        { new: true }
      );
      return user;
    },
    adminUpdateUserLocation: async (_: any, { userId, latitude, longitude }: any, context: any) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const user = await User.findByIdAndUpdate(
        userId,
        {
          latitude,
          longitude,
          locationUpdatedAt: new Date(),
          locationShared: true,
        },
        { new: true }
      );
      return user;
    },

    /** Admin can mark a user as having denied location sharing */
    setUserLocationDenied: async (
      _: any,
      { userId, denied }: { userId: string; denied: boolean },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      const user = await User.findByIdAndUpdate(
        userId,
        {
          locationDenied: denied,
          locationUpdatedAt: new Date(),
        },
        { new: true }
      );
      return {
        latitude: user?.latitude ?? null,
        longitude: user?.longitude ?? null,
        locationUpdatedAt: user?.locationUpdatedAt?.toISOString() || null,
        locationShared: user?.locationShared ?? false,
        locationDenied: user?.locationDenied ?? false,
      };
    },

    /** Admin can force allow a user's location to appear on the map */
    setUserLocationForceAllowed: async (
      _: any,
      { userId, forceAllowed }: { userId: string; forceAllowed: boolean },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      // Force allow: set locationShared to true, locationDenied to false
      const user = await User.findByIdAndUpdate(
        userId,
        {
          locationShared: forceAllowed ? true : undefined,
          locationDenied: forceAllowed ? false : undefined,
          locationUpdatedAt: new Date(),
        },
        { new: true }
      );
      return {
        latitude: user?.latitude ?? null,
        longitude: user?.longitude ?? null,
        locationUpdatedAt: user?.locationUpdatedAt?.toISOString() || null,
        locationShared: user?.locationShared ?? false,
        locationDenied: user?.locationDenied ?? false,
      };
    },

    /** Admin can batch force allow locations for multiple users at once */
    batchForceAllowLocations: async (
      _: any,
      { userIds }: { userIds: string[] },
      context: any
    ) => {
      if (!context.user || !['admin', 'super_admin'].includes(context.user.role)) {
        throw new Error('Not authorized');
      }
      if (!userIds || userIds.length === 0) {
        throw new Error('No user IDs provided');
      }
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            locationShared: true,
            locationDenied: false,
            locationUpdatedAt: new Date(),
          },
        }
      );
      console.log(`✅ Batch force allow: ${result.modifiedCount} users updated (${userIds.length} requested)`);
      return result.modifiedCount;
    },
  },
};
