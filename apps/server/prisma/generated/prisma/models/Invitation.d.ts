import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type InvitationModel = runtime.Types.Result.DefaultSelection<Prisma.$InvitationPayload>;
export type AggregateInvitation = {
    _count: InvitationCountAggregateOutputType | null;
    _min: InvitationMinAggregateOutputType | null;
    _max: InvitationMaxAggregateOutputType | null;
};
export type InvitationMinAggregateOutputType = {
    id: string | null;
    organizationId: string | null;
    email: string | null;
    role: string | null;
    status: string | null;
    expiresAt: Date | null;
    inviterId: string | null;
    createdAt: Date | null;
};
export type InvitationMaxAggregateOutputType = {
    id: string | null;
    organizationId: string | null;
    email: string | null;
    role: string | null;
    status: string | null;
    expiresAt: Date | null;
    inviterId: string | null;
    createdAt: Date | null;
};
export type InvitationCountAggregateOutputType = {
    id: number;
    organizationId: number;
    email: number;
    role: number;
    status: number;
    expiresAt: number;
    inviterId: number;
    createdAt: number;
    _all: number;
};
export type InvitationMinAggregateInputType = {
    id?: true;
    organizationId?: true;
    email?: true;
    role?: true;
    status?: true;
    expiresAt?: true;
    inviterId?: true;
    createdAt?: true;
};
export type InvitationMaxAggregateInputType = {
    id?: true;
    organizationId?: true;
    email?: true;
    role?: true;
    status?: true;
    expiresAt?: true;
    inviterId?: true;
    createdAt?: true;
};
export type InvitationCountAggregateInputType = {
    id?: true;
    organizationId?: true;
    email?: true;
    role?: true;
    status?: true;
    expiresAt?: true;
    inviterId?: true;
    createdAt?: true;
    _all?: true;
};
export type InvitationAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.InvitationWhereInput;
    orderBy?: Prisma.InvitationOrderByWithRelationInput | Prisma.InvitationOrderByWithRelationInput[];
    cursor?: Prisma.InvitationWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | InvitationCountAggregateInputType;
    _min?: InvitationMinAggregateInputType;
    _max?: InvitationMaxAggregateInputType;
};
export type GetInvitationAggregateType<T extends InvitationAggregateArgs> = {
    [P in keyof T & keyof AggregateInvitation]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateInvitation[P]> : Prisma.GetScalarType<T[P], AggregateInvitation[P]>;
};
export type InvitationGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.InvitationWhereInput;
    orderBy?: Prisma.InvitationOrderByWithAggregationInput | Prisma.InvitationOrderByWithAggregationInput[];
    by: Prisma.InvitationScalarFieldEnum[] | Prisma.InvitationScalarFieldEnum;
    having?: Prisma.InvitationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: InvitationCountAggregateInputType | true;
    _min?: InvitationMinAggregateInputType;
    _max?: InvitationMaxAggregateInputType;
};
export type InvitationGroupByOutputType = {
    id: string;
    organizationId: string;
    email: string;
    role: string | null;
    status: string;
    expiresAt: Date;
    inviterId: string;
    createdAt: Date;
    _count: InvitationCountAggregateOutputType | null;
    _min: InvitationMinAggregateOutputType | null;
    _max: InvitationMaxAggregateOutputType | null;
};
export type GetInvitationGroupByPayload<T extends InvitationGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<InvitationGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof InvitationGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], InvitationGroupByOutputType[P]> : Prisma.GetScalarType<T[P], InvitationGroupByOutputType[P]>;
}>>;
export type InvitationWhereInput = {
    AND?: Prisma.InvitationWhereInput | Prisma.InvitationWhereInput[];
    OR?: Prisma.InvitationWhereInput[];
    NOT?: Prisma.InvitationWhereInput | Prisma.InvitationWhereInput[];
    id?: Prisma.StringFilter<"Invitation"> | string;
    organizationId?: Prisma.StringFilter<"Invitation"> | string;
    email?: Prisma.StringFilter<"Invitation"> | string;
    role?: Prisma.StringNullableFilter<"Invitation"> | string | null;
    status?: Prisma.StringFilter<"Invitation"> | string;
    expiresAt?: Prisma.DateTimeFilter<"Invitation"> | Date | string;
    inviterId?: Prisma.StringFilter<"Invitation"> | string;
    createdAt?: Prisma.DateTimeFilter<"Invitation"> | Date | string;
    organization?: Prisma.XOR<Prisma.OrganizationScalarRelationFilter, Prisma.OrganizationWhereInput>;
    inviter?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type InvitationOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    role?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    inviterId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    organization?: Prisma.OrganizationOrderByWithRelationInput;
    inviter?: Prisma.UserOrderByWithRelationInput;
};
export type InvitationWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.InvitationWhereInput | Prisma.InvitationWhereInput[];
    OR?: Prisma.InvitationWhereInput[];
    NOT?: Prisma.InvitationWhereInput | Prisma.InvitationWhereInput[];
    organizationId?: Prisma.StringFilter<"Invitation"> | string;
    email?: Prisma.StringFilter<"Invitation"> | string;
    role?: Prisma.StringNullableFilter<"Invitation"> | string | null;
    status?: Prisma.StringFilter<"Invitation"> | string;
    expiresAt?: Prisma.DateTimeFilter<"Invitation"> | Date | string;
    inviterId?: Prisma.StringFilter<"Invitation"> | string;
    createdAt?: Prisma.DateTimeFilter<"Invitation"> | Date | string;
    organization?: Prisma.XOR<Prisma.OrganizationScalarRelationFilter, Prisma.OrganizationWhereInput>;
    inviter?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id">;
export type InvitationOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    role?: Prisma.SortOrderInput | Prisma.SortOrder;
    status?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    inviterId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.InvitationCountOrderByAggregateInput;
    _max?: Prisma.InvitationMaxOrderByAggregateInput;
    _min?: Prisma.InvitationMinOrderByAggregateInput;
};
export type InvitationScalarWhereWithAggregatesInput = {
    AND?: Prisma.InvitationScalarWhereWithAggregatesInput | Prisma.InvitationScalarWhereWithAggregatesInput[];
    OR?: Prisma.InvitationScalarWhereWithAggregatesInput[];
    NOT?: Prisma.InvitationScalarWhereWithAggregatesInput | Prisma.InvitationScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Invitation"> | string;
    organizationId?: Prisma.StringWithAggregatesFilter<"Invitation"> | string;
    email?: Prisma.StringWithAggregatesFilter<"Invitation"> | string;
    role?: Prisma.StringNullableWithAggregatesFilter<"Invitation"> | string | null;
    status?: Prisma.StringWithAggregatesFilter<"Invitation"> | string;
    expiresAt?: Prisma.DateTimeWithAggregatesFilter<"Invitation"> | Date | string;
    inviterId?: Prisma.StringWithAggregatesFilter<"Invitation"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Invitation"> | Date | string;
};
export type InvitationCreateInput = {
    id: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    createdAt: Date | string;
    organization: Prisma.OrganizationCreateNestedOneWithoutInvitationsInput;
    inviter: Prisma.UserCreateNestedOneWithoutInvitationsInput;
};
export type InvitationUncheckedCreateInput = {
    id: string;
    organizationId: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    inviterId: string;
    createdAt: Date | string;
};
export type InvitationUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    organization?: Prisma.OrganizationUpdateOneRequiredWithoutInvitationsNestedInput;
    inviter?: Prisma.UserUpdateOneRequiredWithoutInvitationsNestedInput;
};
export type InvitationUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inviterId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type InvitationCreateManyInput = {
    id: string;
    organizationId: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    inviterId: string;
    createdAt: Date | string;
};
export type InvitationUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type InvitationUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inviterId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type InvitationListRelationFilter = {
    every?: Prisma.InvitationWhereInput;
    some?: Prisma.InvitationWhereInput;
    none?: Prisma.InvitationWhereInput;
};
export type InvitationOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type InvitationCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    inviterId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type InvitationMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    inviterId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type InvitationMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    email?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    status?: Prisma.SortOrder;
    expiresAt?: Prisma.SortOrder;
    inviterId?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type InvitationCreateNestedManyWithoutInviterInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutInviterInput, Prisma.InvitationUncheckedCreateWithoutInviterInput> | Prisma.InvitationCreateWithoutInviterInput[] | Prisma.InvitationUncheckedCreateWithoutInviterInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutInviterInput | Prisma.InvitationCreateOrConnectWithoutInviterInput[];
    createMany?: Prisma.InvitationCreateManyInviterInputEnvelope;
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
};
export type InvitationUncheckedCreateNestedManyWithoutInviterInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutInviterInput, Prisma.InvitationUncheckedCreateWithoutInviterInput> | Prisma.InvitationCreateWithoutInviterInput[] | Prisma.InvitationUncheckedCreateWithoutInviterInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutInviterInput | Prisma.InvitationCreateOrConnectWithoutInviterInput[];
    createMany?: Prisma.InvitationCreateManyInviterInputEnvelope;
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
};
export type InvitationUpdateManyWithoutInviterNestedInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutInviterInput, Prisma.InvitationUncheckedCreateWithoutInviterInput> | Prisma.InvitationCreateWithoutInviterInput[] | Prisma.InvitationUncheckedCreateWithoutInviterInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutInviterInput | Prisma.InvitationCreateOrConnectWithoutInviterInput[];
    upsert?: Prisma.InvitationUpsertWithWhereUniqueWithoutInviterInput | Prisma.InvitationUpsertWithWhereUniqueWithoutInviterInput[];
    createMany?: Prisma.InvitationCreateManyInviterInputEnvelope;
    set?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    disconnect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    delete?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    update?: Prisma.InvitationUpdateWithWhereUniqueWithoutInviterInput | Prisma.InvitationUpdateWithWhereUniqueWithoutInviterInput[];
    updateMany?: Prisma.InvitationUpdateManyWithWhereWithoutInviterInput | Prisma.InvitationUpdateManyWithWhereWithoutInviterInput[];
    deleteMany?: Prisma.InvitationScalarWhereInput | Prisma.InvitationScalarWhereInput[];
};
export type InvitationUncheckedUpdateManyWithoutInviterNestedInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutInviterInput, Prisma.InvitationUncheckedCreateWithoutInviterInput> | Prisma.InvitationCreateWithoutInviterInput[] | Prisma.InvitationUncheckedCreateWithoutInviterInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutInviterInput | Prisma.InvitationCreateOrConnectWithoutInviterInput[];
    upsert?: Prisma.InvitationUpsertWithWhereUniqueWithoutInviterInput | Prisma.InvitationUpsertWithWhereUniqueWithoutInviterInput[];
    createMany?: Prisma.InvitationCreateManyInviterInputEnvelope;
    set?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    disconnect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    delete?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    update?: Prisma.InvitationUpdateWithWhereUniqueWithoutInviterInput | Prisma.InvitationUpdateWithWhereUniqueWithoutInviterInput[];
    updateMany?: Prisma.InvitationUpdateManyWithWhereWithoutInviterInput | Prisma.InvitationUpdateManyWithWhereWithoutInviterInput[];
    deleteMany?: Prisma.InvitationScalarWhereInput | Prisma.InvitationScalarWhereInput[];
};
export type InvitationCreateNestedManyWithoutOrganizationInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutOrganizationInput, Prisma.InvitationUncheckedCreateWithoutOrganizationInput> | Prisma.InvitationCreateWithoutOrganizationInput[] | Prisma.InvitationUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutOrganizationInput | Prisma.InvitationCreateOrConnectWithoutOrganizationInput[];
    createMany?: Prisma.InvitationCreateManyOrganizationInputEnvelope;
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
};
export type InvitationUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutOrganizationInput, Prisma.InvitationUncheckedCreateWithoutOrganizationInput> | Prisma.InvitationCreateWithoutOrganizationInput[] | Prisma.InvitationUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutOrganizationInput | Prisma.InvitationCreateOrConnectWithoutOrganizationInput[];
    createMany?: Prisma.InvitationCreateManyOrganizationInputEnvelope;
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
};
export type InvitationUpdateManyWithoutOrganizationNestedInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutOrganizationInput, Prisma.InvitationUncheckedCreateWithoutOrganizationInput> | Prisma.InvitationCreateWithoutOrganizationInput[] | Prisma.InvitationUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutOrganizationInput | Prisma.InvitationCreateOrConnectWithoutOrganizationInput[];
    upsert?: Prisma.InvitationUpsertWithWhereUniqueWithoutOrganizationInput | Prisma.InvitationUpsertWithWhereUniqueWithoutOrganizationInput[];
    createMany?: Prisma.InvitationCreateManyOrganizationInputEnvelope;
    set?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    disconnect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    delete?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    update?: Prisma.InvitationUpdateWithWhereUniqueWithoutOrganizationInput | Prisma.InvitationUpdateWithWhereUniqueWithoutOrganizationInput[];
    updateMany?: Prisma.InvitationUpdateManyWithWhereWithoutOrganizationInput | Prisma.InvitationUpdateManyWithWhereWithoutOrganizationInput[];
    deleteMany?: Prisma.InvitationScalarWhereInput | Prisma.InvitationScalarWhereInput[];
};
export type InvitationUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: Prisma.XOR<Prisma.InvitationCreateWithoutOrganizationInput, Prisma.InvitationUncheckedCreateWithoutOrganizationInput> | Prisma.InvitationCreateWithoutOrganizationInput[] | Prisma.InvitationUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.InvitationCreateOrConnectWithoutOrganizationInput | Prisma.InvitationCreateOrConnectWithoutOrganizationInput[];
    upsert?: Prisma.InvitationUpsertWithWhereUniqueWithoutOrganizationInput | Prisma.InvitationUpsertWithWhereUniqueWithoutOrganizationInput[];
    createMany?: Prisma.InvitationCreateManyOrganizationInputEnvelope;
    set?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    disconnect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    delete?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    connect?: Prisma.InvitationWhereUniqueInput | Prisma.InvitationWhereUniqueInput[];
    update?: Prisma.InvitationUpdateWithWhereUniqueWithoutOrganizationInput | Prisma.InvitationUpdateWithWhereUniqueWithoutOrganizationInput[];
    updateMany?: Prisma.InvitationUpdateManyWithWhereWithoutOrganizationInput | Prisma.InvitationUpdateManyWithWhereWithoutOrganizationInput[];
    deleteMany?: Prisma.InvitationScalarWhereInput | Prisma.InvitationScalarWhereInput[];
};
export type InvitationCreateWithoutInviterInput = {
    id: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    createdAt: Date | string;
    organization: Prisma.OrganizationCreateNestedOneWithoutInvitationsInput;
};
export type InvitationUncheckedCreateWithoutInviterInput = {
    id: string;
    organizationId: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    createdAt: Date | string;
};
export type InvitationCreateOrConnectWithoutInviterInput = {
    where: Prisma.InvitationWhereUniqueInput;
    create: Prisma.XOR<Prisma.InvitationCreateWithoutInviterInput, Prisma.InvitationUncheckedCreateWithoutInviterInput>;
};
export type InvitationCreateManyInviterInputEnvelope = {
    data: Prisma.InvitationCreateManyInviterInput | Prisma.InvitationCreateManyInviterInput[];
    skipDuplicates?: boolean;
};
export type InvitationUpsertWithWhereUniqueWithoutInviterInput = {
    where: Prisma.InvitationWhereUniqueInput;
    update: Prisma.XOR<Prisma.InvitationUpdateWithoutInviterInput, Prisma.InvitationUncheckedUpdateWithoutInviterInput>;
    create: Prisma.XOR<Prisma.InvitationCreateWithoutInviterInput, Prisma.InvitationUncheckedCreateWithoutInviterInput>;
};
export type InvitationUpdateWithWhereUniqueWithoutInviterInput = {
    where: Prisma.InvitationWhereUniqueInput;
    data: Prisma.XOR<Prisma.InvitationUpdateWithoutInviterInput, Prisma.InvitationUncheckedUpdateWithoutInviterInput>;
};
export type InvitationUpdateManyWithWhereWithoutInviterInput = {
    where: Prisma.InvitationScalarWhereInput;
    data: Prisma.XOR<Prisma.InvitationUpdateManyMutationInput, Prisma.InvitationUncheckedUpdateManyWithoutInviterInput>;
};
export type InvitationScalarWhereInput = {
    AND?: Prisma.InvitationScalarWhereInput | Prisma.InvitationScalarWhereInput[];
    OR?: Prisma.InvitationScalarWhereInput[];
    NOT?: Prisma.InvitationScalarWhereInput | Prisma.InvitationScalarWhereInput[];
    id?: Prisma.StringFilter<"Invitation"> | string;
    organizationId?: Prisma.StringFilter<"Invitation"> | string;
    email?: Prisma.StringFilter<"Invitation"> | string;
    role?: Prisma.StringNullableFilter<"Invitation"> | string | null;
    status?: Prisma.StringFilter<"Invitation"> | string;
    expiresAt?: Prisma.DateTimeFilter<"Invitation"> | Date | string;
    inviterId?: Prisma.StringFilter<"Invitation"> | string;
    createdAt?: Prisma.DateTimeFilter<"Invitation"> | Date | string;
};
export type InvitationCreateWithoutOrganizationInput = {
    id: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    createdAt: Date | string;
    inviter: Prisma.UserCreateNestedOneWithoutInvitationsInput;
};
export type InvitationUncheckedCreateWithoutOrganizationInput = {
    id: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    inviterId: string;
    createdAt: Date | string;
};
export type InvitationCreateOrConnectWithoutOrganizationInput = {
    where: Prisma.InvitationWhereUniqueInput;
    create: Prisma.XOR<Prisma.InvitationCreateWithoutOrganizationInput, Prisma.InvitationUncheckedCreateWithoutOrganizationInput>;
};
export type InvitationCreateManyOrganizationInputEnvelope = {
    data: Prisma.InvitationCreateManyOrganizationInput | Prisma.InvitationCreateManyOrganizationInput[];
    skipDuplicates?: boolean;
};
export type InvitationUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: Prisma.InvitationWhereUniqueInput;
    update: Prisma.XOR<Prisma.InvitationUpdateWithoutOrganizationInput, Prisma.InvitationUncheckedUpdateWithoutOrganizationInput>;
    create: Prisma.XOR<Prisma.InvitationCreateWithoutOrganizationInput, Prisma.InvitationUncheckedCreateWithoutOrganizationInput>;
};
export type InvitationUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: Prisma.InvitationWhereUniqueInput;
    data: Prisma.XOR<Prisma.InvitationUpdateWithoutOrganizationInput, Prisma.InvitationUncheckedUpdateWithoutOrganizationInput>;
};
export type InvitationUpdateManyWithWhereWithoutOrganizationInput = {
    where: Prisma.InvitationScalarWhereInput;
    data: Prisma.XOR<Prisma.InvitationUpdateManyMutationInput, Prisma.InvitationUncheckedUpdateManyWithoutOrganizationInput>;
};
export type InvitationCreateManyInviterInput = {
    id: string;
    organizationId: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    createdAt: Date | string;
};
export type InvitationUpdateWithoutInviterInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    organization?: Prisma.OrganizationUpdateOneRequiredWithoutInvitationsNestedInput;
};
export type InvitationUncheckedUpdateWithoutInviterInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type InvitationUncheckedUpdateManyWithoutInviterInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type InvitationCreateManyOrganizationInput = {
    id: string;
    email: string;
    role?: string | null;
    status: string;
    expiresAt: Date | string;
    inviterId: string;
    createdAt: Date | string;
};
export type InvitationUpdateWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inviter?: Prisma.UserUpdateOneRequiredWithoutInvitationsNestedInput;
};
export type InvitationUncheckedUpdateWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inviterId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type InvitationUncheckedUpdateManyWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    email?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    status?: Prisma.StringFieldUpdateOperationsInput | string;
    expiresAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    inviterId?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type InvitationSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    organizationId?: boolean;
    email?: boolean;
    role?: boolean;
    status?: boolean;
    expiresAt?: boolean;
    inviterId?: boolean;
    createdAt?: boolean;
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    inviter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["invitation"]>;
export type InvitationSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    organizationId?: boolean;
    email?: boolean;
    role?: boolean;
    status?: boolean;
    expiresAt?: boolean;
    inviterId?: boolean;
    createdAt?: boolean;
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    inviter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["invitation"]>;
export type InvitationSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    organizationId?: boolean;
    email?: boolean;
    role?: boolean;
    status?: boolean;
    expiresAt?: boolean;
    inviterId?: boolean;
    createdAt?: boolean;
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    inviter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["invitation"]>;
export type InvitationSelectScalar = {
    id?: boolean;
    organizationId?: boolean;
    email?: boolean;
    role?: boolean;
    status?: boolean;
    expiresAt?: boolean;
    inviterId?: boolean;
    createdAt?: boolean;
};
export type InvitationOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "organizationId" | "email" | "role" | "status" | "expiresAt" | "inviterId" | "createdAt", ExtArgs["result"]["invitation"]>;
export type InvitationInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    inviter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type InvitationIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    inviter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type InvitationIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    inviter?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $InvitationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Invitation";
    objects: {
        organization: Prisma.$OrganizationPayload<ExtArgs>;
        inviter: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        organizationId: string;
        email: string;
        role: string | null;
        status: string;
        expiresAt: Date;
        inviterId: string;
        createdAt: Date;
    }, ExtArgs["result"]["invitation"]>;
    composites: {};
};
export type InvitationGetPayload<S extends boolean | null | undefined | InvitationDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$InvitationPayload, S>;
export type InvitationCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<InvitationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: InvitationCountAggregateInputType | true;
};
export interface InvitationDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Invitation'];
        meta: {
            name: 'Invitation';
        };
    };
    findUnique<T extends InvitationFindUniqueArgs>(args: Prisma.SelectSubset<T, InvitationFindUniqueArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends InvitationFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, InvitationFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends InvitationFindFirstArgs>(args?: Prisma.SelectSubset<T, InvitationFindFirstArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends InvitationFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, InvitationFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends InvitationFindManyArgs>(args?: Prisma.SelectSubset<T, InvitationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends InvitationCreateArgs>(args: Prisma.SelectSubset<T, InvitationCreateArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends InvitationCreateManyArgs>(args?: Prisma.SelectSubset<T, InvitationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends InvitationCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, InvitationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends InvitationDeleteArgs>(args: Prisma.SelectSubset<T, InvitationDeleteArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends InvitationUpdateArgs>(args: Prisma.SelectSubset<T, InvitationUpdateArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends InvitationDeleteManyArgs>(args?: Prisma.SelectSubset<T, InvitationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends InvitationUpdateManyArgs>(args: Prisma.SelectSubset<T, InvitationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends InvitationUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, InvitationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends InvitationUpsertArgs>(args: Prisma.SelectSubset<T, InvitationUpsertArgs<ExtArgs>>): Prisma.Prisma__InvitationClient<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends InvitationCountArgs>(args?: Prisma.Subset<T, InvitationCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], InvitationCountAggregateOutputType> : number>;
    aggregate<T extends InvitationAggregateArgs>(args: Prisma.Subset<T, InvitationAggregateArgs>): Prisma.PrismaPromise<GetInvitationAggregateType<T>>;
    groupBy<T extends InvitationGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: InvitationGroupByArgs['orderBy'];
    } : {
        orderBy?: InvitationGroupByArgs['orderBy'];
    }, OrderFields extends Prisma.ExcludeUnderscoreKeys<Prisma.Keys<Prisma.MaybeTupleToUnion<T['orderBy']>>>, ByFields extends Prisma.MaybeTupleToUnion<T['by']>, ByValid extends Prisma.Has<ByFields, OrderFields>, HavingFields extends Prisma.GetHavingFields<T['having']>, HavingValid extends Prisma.Has<ByFields, HavingFields>, ByEmpty extends T['by'] extends never[] ? Prisma.True : Prisma.False, InputErrors extends ByEmpty extends Prisma.True ? `Error: "by" must not be empty.` : HavingValid extends Prisma.False ? {
        [P in HavingFields]: P extends ByFields ? never : P extends string ? `Error: Field "${P}" used in "having" needs to be provided in "by".` : [
            Error,
            'Field ',
            P,
            ` in "having" needs to be provided in "by"`
        ];
    }[HavingFields] : 'take' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "take", you also need to provide "orderBy"' : 'skip' extends Prisma.Keys<T> ? 'orderBy' extends Prisma.Keys<T> ? ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields] : 'Error: If you provide "skip", you also need to provide "orderBy"' : ByValid extends Prisma.True ? {} : {
        [P in OrderFields]: P extends ByFields ? never : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, InvitationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvitationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: InvitationFieldRefs;
}
export interface Prisma__InvitationClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    organization<T extends Prisma.OrganizationDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.OrganizationDefaultArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    inviter<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface InvitationFieldRefs {
    readonly id: Prisma.FieldRef<"Invitation", 'String'>;
    readonly organizationId: Prisma.FieldRef<"Invitation", 'String'>;
    readonly email: Prisma.FieldRef<"Invitation", 'String'>;
    readonly role: Prisma.FieldRef<"Invitation", 'String'>;
    readonly status: Prisma.FieldRef<"Invitation", 'String'>;
    readonly expiresAt: Prisma.FieldRef<"Invitation", 'DateTime'>;
    readonly inviterId: Prisma.FieldRef<"Invitation", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Invitation", 'DateTime'>;
}
export type InvitationFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    where: Prisma.InvitationWhereUniqueInput;
};
export type InvitationFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    where: Prisma.InvitationWhereUniqueInput;
};
export type InvitationFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    where?: Prisma.InvitationWhereInput;
    orderBy?: Prisma.InvitationOrderByWithRelationInput | Prisma.InvitationOrderByWithRelationInput[];
    cursor?: Prisma.InvitationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.InvitationScalarFieldEnum | Prisma.InvitationScalarFieldEnum[];
};
export type InvitationFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    where?: Prisma.InvitationWhereInput;
    orderBy?: Prisma.InvitationOrderByWithRelationInput | Prisma.InvitationOrderByWithRelationInput[];
    cursor?: Prisma.InvitationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.InvitationScalarFieldEnum | Prisma.InvitationScalarFieldEnum[];
};
export type InvitationFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    where?: Prisma.InvitationWhereInput;
    orderBy?: Prisma.InvitationOrderByWithRelationInput | Prisma.InvitationOrderByWithRelationInput[];
    cursor?: Prisma.InvitationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.InvitationScalarFieldEnum | Prisma.InvitationScalarFieldEnum[];
};
export type InvitationCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.InvitationCreateInput, Prisma.InvitationUncheckedCreateInput>;
};
export type InvitationCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.InvitationCreateManyInput | Prisma.InvitationCreateManyInput[];
    skipDuplicates?: boolean;
};
export type InvitationCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    data: Prisma.InvitationCreateManyInput | Prisma.InvitationCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.InvitationIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type InvitationUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.InvitationUpdateInput, Prisma.InvitationUncheckedUpdateInput>;
    where: Prisma.InvitationWhereUniqueInput;
};
export type InvitationUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.InvitationUpdateManyMutationInput, Prisma.InvitationUncheckedUpdateManyInput>;
    where?: Prisma.InvitationWhereInput;
    limit?: number;
};
export type InvitationUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.InvitationUpdateManyMutationInput, Prisma.InvitationUncheckedUpdateManyInput>;
    where?: Prisma.InvitationWhereInput;
    limit?: number;
    include?: Prisma.InvitationIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type InvitationUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    where: Prisma.InvitationWhereUniqueInput;
    create: Prisma.XOR<Prisma.InvitationCreateInput, Prisma.InvitationUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.InvitationUpdateInput, Prisma.InvitationUncheckedUpdateInput>;
};
export type InvitationDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
    where: Prisma.InvitationWhereUniqueInput;
};
export type InvitationDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.InvitationWhereInput;
    limit?: number;
};
export type InvitationDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.InvitationSelect<ExtArgs> | null;
    omit?: Prisma.InvitationOmit<ExtArgs> | null;
    include?: Prisma.InvitationInclude<ExtArgs> | null;
};
