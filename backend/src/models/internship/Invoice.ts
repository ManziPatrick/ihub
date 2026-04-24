import mongoose, { Schema, Document } from 'mongoose';

export interface IInternshipInvoice extends Document {
    paymentId: mongoose.Types.ObjectId;
    invoiceNumber: string;
    userId: mongoose.Types.ObjectId;
    internshipProgramId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    issuedAt: Date;
    dueDate: Date;
    pdfUrl?: string;
    status: 'draft' | 'issued' | 'paid' | 'cancelled';
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    notes?: string;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InternshipInvoiceSchema: Schema = new Schema(
    {
        paymentId: {
            type: Schema.Types.ObjectId,
            ref: 'InternshipPayment',
            required: true,
            index: true
        },
        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        internshipProgramId: {
            type: Schema.Types.ObjectId,
            ref: 'InternshipProgram',
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            required: true,
            default: 'RWF',
            uppercase: true
        },
        issuedAt: {
            type: Date,
            required: true,
            default: Date.now
        },
        dueDate: {
            type: Date,
            required: true
        },
        pdfUrl: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['draft', 'issued', 'paid', 'cancelled'],
            default: 'draft',
            required: true
        },
        items: [{
            description: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            unitPrice: {
                type: Number,
                required: true,
                min: 0
            },
            total: {
                type: Number,
                required: true,
                min: 0
            }
        }],
        notes: {
            type: String,
            trim: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Generate invoice number before saving if not exists
InternshipInvoiceSchema.pre('save', async function () {
    if (!this.get('invoiceNumber')) {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');

        // Find the last invoice for this month
        const lastInvoice = await mongoose.model('InternshipInvoice')
            .findOne({ invoiceNumber: new RegExp(`^INV-${year}${month}`) })
            .sort({ invoiceNumber: -1 });

        let sequence = 1;
        if (lastInvoice) {
            const lastSequence = parseInt((lastInvoice as any).invoiceNumber.split('-')[2]);
            sequence = lastSequence + 1;
        }

        this.set('invoiceNumber', `INV-${year}${month}-${String(sequence).padStart(4, '0')}`);
    }
});

export const InternshipInvoice = mongoose.model<IInternshipInvoice>('InternshipInvoice', InternshipInvoiceSchema);
