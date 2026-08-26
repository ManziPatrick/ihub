import { GraphQLError } from "graphql";
import { User } from '../models/User';
import { lookupRequestGeoLocation } from '../services/geoip.service';

export const locationResolvers = {
  Query: {
    getMyIpGeolocation: async (_: any, __: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });

      const result = await lookupRequestGeoLocation(context?.req);

      // Auto-save the IP-detected location to the user's record so they appear on the map
      if (result.latitude != null && result.longitude != null) {
        try {
          await User.findByIdAndUpdate(context.user.id, {
            latitude: result.latitude,
            longitude: result.longitude,
            location: [result.city, result.country].filter(Boolean).join(', '),
            locationUpdatedAt: new Date(),
            // Tracking is on by default — IP-based location counts as tracked
            locationShared: true,
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
      // The live location map is a platform-wide view — super admin only.
      if (!context.user || context.user.role !== 'super_admin') {
        throw new Error('Not authorized');
      }
      // Return ALL platform users (not just those with coordinates) so the
      // super admin sees every user on the map.
      const filter: any = {
        isDeleted: { $ne: true },
      };
      if (role) filter.role = role;

      const users = await User.find(filter)
        .select(
          'id username email role fullName avatar phone location latitude longitude locationUpdatedAt locationShared locationDenied title isOnline lastActive'
        )
        .populate('enrolledCourses', 'title');
      return users.map((u: any) => ({
        id: u._id.toString(),
        // Some legacy/Google-created users have a null username or email —
        // the User GraphQL type declares them non-nullable, so coerce to a
        // safe fallback instead of crashing the whole map with
        // "Cannot return null for non-nullable field User.username".
        username: u.username || u.fullName || u.email || 'Unknown User',
        email: u.email || '',
        role: u.role || 'student',
        fullName: u.fullName || u.username || '',
        avatar: u.avatar,
        phone: u.phone,
        location: u.location,
        latitude: u.latitude ?? null,
        longitude: u.longitude ?? null,
        locationUpdatedAt: u.locationUpdatedAt?.toISOString(),
        locationShared: u.locationShared ?? false,
        locationDenied: u.locationDenied ?? false,
        title: u.title,
        isOnline: u.isOnline ?? false,
        lastActive: u.lastActive?.toISOString(),
        // Track which course(s) each user is taking
        enrolledCourses: (u.enrolledCourses || []).map((c: any) => ({
          id: (c._id || c.id)?.toString(),
          title: c.title,
        })),
      }));
    },
  },
  Mutation: {
    updateUserLocation: async (_: any, { latitude, longitude }: any, context: any) => {
      if (!context.user) throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
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
      if (!user) throw new Error('User not found');
      return {
        id: user._id.toString(),
        username: user.username || user.fullName || user.email || 'Unknown User',
        email: user.email || '',
        role: user.role || 'student',
        latitude: user.latitude ?? null,
        longitude: user.longitude ?? null,
        locationUpdatedAt: user.locationUpdatedAt?.toISOString() || null,
        locationShared: user.locationShared ?? false,
      };
    },
    adminUpdateUserLocation: async (_: any, { userId, latitude, longitude }: any, context: any) => {
      if (!context.user || context.user.role !== 'super_admin') {
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
      if (!user) throw new Error('User not found');
      return {
        id: user._id.toString(),
        username: user.username || user.fullName || user.email || 'Unknown User',
        email: user.email || '',
        role: user.role || 'student',
        latitude: user.latitude ?? null,
        longitude: user.longitude ?? null,
        locationUpdatedAt: user.locationUpdatedAt?.toISOString() || null,
        locationShared: user.locationShared ?? false,
      };
    },

    /** Admin can mark a user as having denied location sharing */
    setUserLocationDenied: async (
      _: any,
      { userId, denied }: { userId: string; denied: boolean },
      context: any
    ) => {
      if (!context.user || context.user.role !== 'super_admin') {
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
      if (!context.user || context.user.role !== 'super_admin') {
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
      if (!context.user || context.user.role !== 'super_admin') {
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
