import mongoose, {
  Schema,
  Document,
  HookNextFunction,
} from 'mongoose';
import bcrypt from 'bcryptjs';
import { AuthenticationMethod } from './../enums/common';

export interface IGoogleUser {
  id: string;
  email: string;
  displayName: string;
  thumbImage: string;
}

export interface ILocalUser {
  email: string;
  password: string;
}

export interface IUser extends Document {
  methods: string[];
  google: IGoogleUser;
  local: ILocalUser;
  isValidPassword: (newPassword: string) => Promise<boolean>;
}

const userSchema: Schema<IUser> = new mongoose.Schema({
  methods: {
    type: [String],
    required: true,
  },
  local: {
    email: {
      type: String,
      lowercase: true,
    },
    password: {
      type: String,
    },
  },
  google: {
    id: {
      type: String,
    },
    displayName: {
      type: String,
    },
    thumbImage: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
  },
});

userSchema.pre<IUser>('save', async function (
  next: HookNextFunction
) {
  try {
    if (!this.methods.includes(AuthenticationMethod.LOCAL)) {
      next();
    }
    const user = this;
    if (!user.isModified('local.password')) {
      next();
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(this.local.password, salt);
    this.local.password = passwordHash;
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.isValidPassword = async function (
  newPassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(newPassword, this.local.password);
  } catch (error) {
    throw new Error(error);
  }
};

export default mongoose.model<IUser>('user', userSchema);
