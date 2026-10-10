import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type MemberModel = runtime.Types.Result.DefaultSelection<Prisma.$MemberPayload>;
export type AggregateMember = {
    _count: MemberCountAggregateOutputType | null;
    _min: MemberMinAggregateOutputType | null;
    _max: MemberMaxAggregateOutputType | null;
};
export type MemberMinAggregateOutputType = {
    id: string | null;
    organizationId: string | null;
    userId: string | null;
    role: string | null;
    createdAt: Date | null;
};
export type MemberMaxAggregateOutputType = {
    id: string | null;
    organizationId: string | null;
    userId: string | null;
    role: string | null;
    createdAt: Date | null;
};
export type MemberCountAggregateOutputType = {
    id: number;
    organizationId: number;
    userId: number;
    role: number;
    createdAt: number;
    _all: number;
};
export type MemberMinAggregateInputType = {
    id?: true;
    organizationId?: true;
    userId?: true;
    role?: true;
    createdAt?: true;
};
export type MemberMaxAggregateInputType = {
    id?: true;
    organizationId?: true;
    userId?: true;
    role?: true;
    createdAt?: true;
};
export type MemberCountAggregateInputType = {
    id?: true;
    organizationId?: true;
    userId?: true;
    role?: true;
    createdAt?: true;
    _all?: true;
};
export type MemberAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MemberWhereInput;
    orderBy?: Prisma.MemberOrderByWithRelationInput | Prisma.MemberOrderByWithRelationInput[];
    cursor?: Prisma.MemberWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | MemberCountAggregateInputType;
    _min?: MemberMinAggregateInputType;
    _max?: MemberMaxAggregateInputType;
};
export type GetMemberAggregateType<T extends MemberAggregateArgs> = {
    [P in keyof T & keyof AggregateMember]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateMember[P]> : Prisma.GetScalarType<T[P], AggregateMember[P]>;
};
export type MemberGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MemberWhereInput;
    orderBy?: Prisma.MemberOrderByWithAggregationInput | Prisma.MemberOrderByWithAggregationInput[];
    by: Prisma.MemberScalarFieldEnum[] | Prisma.MemberScalarFieldEnum;
    having?: Prisma.MemberScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: MemberCountAggregateInputType | true;
    _min?: MemberMinAggregateInputType;
    _max?: MemberMaxAggregateInputType;
};
export type MemberGroupByOutputType = {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
    _count: MemberCountAggregateOutputType | null;
    _min: MemberMinAggregateOutputType | null;
    _max: MemberMaxAggregateOutputType | null;
};
export type GetMemberGroupByPayload<T extends MemberGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<MemberGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof MemberGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], MemberGroupByOutputType[P]> : Prisma.GetScalarType<T[P], MemberGroupByOutputType[P]>;
}>>;
export type MemberWhereInput = {
    AND?: Prisma.MemberWhereInput | Prisma.MemberWhereInput[];
    OR?: Prisma.MemberWhereInput[];
    NOT?: Prisma.MemberWhereInput | Prisma.MemberWhereInput[];
    id?: Prisma.StringFilter<"Member"> | string;
    organizationId?: Prisma.StringFilter<"Member"> | string;
    userId?: Prisma.StringFilter<"Member"> | string;
    role?: Prisma.StringFilter<"Member"> | string;
    createdAt?: Prisma.DateTimeFilter<"Member"> | Date | string;
    organization?: Prisma.XOR<Prisma.OrganizationScalarRelationFilter, Prisma.OrganizationWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
};
export type MemberOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    organization?: Prisma.OrganizationOrderByWithRelationInput;
    user?: Prisma.UserOrderByWithRelationInput;
};
export type MemberWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    AND?: Prisma.MemberWhereInput | Prisma.MemberWhereInput[];
    OR?: Prisma.MemberWhereInput[];
    NOT?: Prisma.MemberWhereInput | Prisma.MemberWhereInput[];
    organizationId?: Prisma.StringFilter<"Member"> | string;
    userId?: Prisma.StringFilter<"Member"> | string;
    role?: Prisma.StringFilter<"Member"> | string;
    createdAt?: Prisma.DateTimeFilter<"Member"> | Date | string;
    organization?: Prisma.XOR<Prisma.OrganizationScalarRelationFilter, Prisma.OrganizationWhereInput>;
    user?: Prisma.XOR<Prisma.UserScalarRelationFilter, Prisma.UserWhereInput>;
}, "id">;
export type MemberOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    _count?: Prisma.MemberCountOrderByAggregateInput;
    _max?: Prisma.MemberMaxOrderByAggregateInput;
    _min?: Prisma.MemberMinOrderByAggregateInput;
};
export type MemberScalarWhereWithAggregatesInput = {
    AND?: Prisma.MemberScalarWhereWithAggregatesInput | Prisma.MemberScalarWhereWithAggregatesInput[];
    OR?: Prisma.MemberScalarWhereWithAggregatesInput[];
    NOT?: Prisma.MemberScalarWhereWithAggregatesInput | Prisma.MemberScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Member"> | string;
    organizationId?: Prisma.StringWithAggregatesFilter<"Member"> | string;
    userId?: Prisma.StringWithAggregatesFilter<"Member"> | string;
    role?: Prisma.StringWithAggregatesFilter<"Member"> | string;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Member"> | Date | string;
};
export type MemberCreateInput = {
    id: string;
    role: string;
    createdAt: Date | string;
    organization: Prisma.OrganizationCreateNestedOneWithoutMembersInput;
    user: Prisma.UserCreateNestedOneWithoutMembersInput;
};
export type MemberUncheckedCreateInput = {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date | string;
};
export type MemberUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    organization?: Prisma.OrganizationUpdateOneRequiredWithoutMembersNestedInput;
    user?: Prisma.UserUpdateOneRequiredWithoutMembersNestedInput;
};
export type MemberUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MemberCreateManyInput = {
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date | string;
};
export type MemberUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MemberUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MemberListRelationFilter = {
    every?: Prisma.MemberWhereInput;
    some?: Prisma.MemberWhereInput;
    none?: Prisma.MemberWhereInput;
};
export type MemberOrderByRelationAggregateInput = {
    _count?: Prisma.SortOrder;
};
export type MemberCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MemberMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MemberMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    organizationId?: Prisma.SortOrder;
    userId?: Prisma.SortOrder;
    role?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
};
export type MemberCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutUserInput, Prisma.MemberUncheckedCreateWithoutUserInput> | Prisma.MemberCreateWithoutUserInput[] | Prisma.MemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutUserInput | Prisma.MemberCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.MemberCreateManyUserInputEnvelope;
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
};
export type MemberUncheckedCreateNestedManyWithoutUserInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutUserInput, Prisma.MemberUncheckedCreateWithoutUserInput> | Prisma.MemberCreateWithoutUserInput[] | Prisma.MemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutUserInput | Prisma.MemberCreateOrConnectWithoutUserInput[];
    createMany?: Prisma.MemberCreateManyUserInputEnvelope;
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
};
export type MemberUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutUserInput, Prisma.MemberUncheckedCreateWithoutUserInput> | Prisma.MemberCreateWithoutUserInput[] | Prisma.MemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutUserInput | Prisma.MemberCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.MemberUpsertWithWhereUniqueWithoutUserInput | Prisma.MemberUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.MemberCreateManyUserInputEnvelope;
    set?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    disconnect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    delete?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    update?: Prisma.MemberUpdateWithWhereUniqueWithoutUserInput | Prisma.MemberUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.MemberUpdateManyWithWhereWithoutUserInput | Prisma.MemberUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.MemberScalarWhereInput | Prisma.MemberScalarWhereInput[];
};
export type MemberUncheckedUpdateManyWithoutUserNestedInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutUserInput, Prisma.MemberUncheckedCreateWithoutUserInput> | Prisma.MemberCreateWithoutUserInput[] | Prisma.MemberUncheckedCreateWithoutUserInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutUserInput | Prisma.MemberCreateOrConnectWithoutUserInput[];
    upsert?: Prisma.MemberUpsertWithWhereUniqueWithoutUserInput | Prisma.MemberUpsertWithWhereUniqueWithoutUserInput[];
    createMany?: Prisma.MemberCreateManyUserInputEnvelope;
    set?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    disconnect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    delete?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    update?: Prisma.MemberUpdateWithWhereUniqueWithoutUserInput | Prisma.MemberUpdateWithWhereUniqueWithoutUserInput[];
    updateMany?: Prisma.MemberUpdateManyWithWhereWithoutUserInput | Prisma.MemberUpdateManyWithWhereWithoutUserInput[];
    deleteMany?: Prisma.MemberScalarWhereInput | Prisma.MemberScalarWhereInput[];
};
export type MemberCreateNestedManyWithoutOrganizationInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutOrganizationInput, Prisma.MemberUncheckedCreateWithoutOrganizationInput> | Prisma.MemberCreateWithoutOrganizationInput[] | Prisma.MemberUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutOrganizationInput | Prisma.MemberCreateOrConnectWithoutOrganizationInput[];
    createMany?: Prisma.MemberCreateManyOrganizationInputEnvelope;
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
};
export type MemberUncheckedCreateNestedManyWithoutOrganizationInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutOrganizationInput, Prisma.MemberUncheckedCreateWithoutOrganizationInput> | Prisma.MemberCreateWithoutOrganizationInput[] | Prisma.MemberUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutOrganizationInput | Prisma.MemberCreateOrConnectWithoutOrganizationInput[];
    createMany?: Prisma.MemberCreateManyOrganizationInputEnvelope;
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
};
export type MemberUpdateManyWithoutOrganizationNestedInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutOrganizationInput, Prisma.MemberUncheckedCreateWithoutOrganizationInput> | Prisma.MemberCreateWithoutOrganizationInput[] | Prisma.MemberUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutOrganizationInput | Prisma.MemberCreateOrConnectWithoutOrganizationInput[];
    upsert?: Prisma.MemberUpsertWithWhereUniqueWithoutOrganizationInput | Prisma.MemberUpsertWithWhereUniqueWithoutOrganizationInput[];
    createMany?: Prisma.MemberCreateManyOrganizationInputEnvelope;
    set?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    disconnect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    delete?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    update?: Prisma.MemberUpdateWithWhereUniqueWithoutOrganizationInput | Prisma.MemberUpdateWithWhereUniqueWithoutOrganizationInput[];
    updateMany?: Prisma.MemberUpdateManyWithWhereWithoutOrganizationInput | Prisma.MemberUpdateManyWithWhereWithoutOrganizationInput[];
    deleteMany?: Prisma.MemberScalarWhereInput | Prisma.MemberScalarWhereInput[];
};
export type MemberUncheckedUpdateManyWithoutOrganizationNestedInput = {
    create?: Prisma.XOR<Prisma.MemberCreateWithoutOrganizationInput, Prisma.MemberUncheckedCreateWithoutOrganizationInput> | Prisma.MemberCreateWithoutOrganizationInput[] | Prisma.MemberUncheckedCreateWithoutOrganizationInput[];
    connectOrCreate?: Prisma.MemberCreateOrConnectWithoutOrganizationInput | Prisma.MemberCreateOrConnectWithoutOrganizationInput[];
    upsert?: Prisma.MemberUpsertWithWhereUniqueWithoutOrganizationInput | Prisma.MemberUpsertWithWhereUniqueWithoutOrganizationInput[];
    createMany?: Prisma.MemberCreateManyOrganizationInputEnvelope;
    set?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    disconnect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    delete?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    connect?: Prisma.MemberWhereUniqueInput | Prisma.MemberWhereUniqueInput[];
    update?: Prisma.MemberUpdateWithWhereUniqueWithoutOrganizationInput | Prisma.MemberUpdateWithWhereUniqueWithoutOrganizationInput[];
    updateMany?: Prisma.MemberUpdateManyWithWhereWithoutOrganizationInput | Prisma.MemberUpdateManyWithWhereWithoutOrganizationInput[];
    deleteMany?: Prisma.MemberScalarWhereInput | Prisma.MemberScalarWhereInput[];
};
export type MemberCreateWithoutUserInput = {
    id: string;
    role: string;
    createdAt: Date | string;
    organization: Prisma.OrganizationCreateNestedOneWithoutMembersInput;
};
export type MemberUncheckedCreateWithoutUserInput = {
    id: string;
    organizationId: string;
    role: string;
    createdAt: Date | string;
};
export type MemberCreateOrConnectWithoutUserInput = {
    where: Prisma.MemberWhereUniqueInput;
    create: Prisma.XOR<Prisma.MemberCreateWithoutUserInput, Prisma.MemberUncheckedCreateWithoutUserInput>;
};
export type MemberCreateManyUserInputEnvelope = {
    data: Prisma.MemberCreateManyUserInput | Prisma.MemberCreateManyUserInput[];
    skipDuplicates?: boolean;
};
export type MemberUpsertWithWhereUniqueWithoutUserInput = {
    where: Prisma.MemberWhereUniqueInput;
    update: Prisma.XOR<Prisma.MemberUpdateWithoutUserInput, Prisma.MemberUncheckedUpdateWithoutUserInput>;
    create: Prisma.XOR<Prisma.MemberCreateWithoutUserInput, Prisma.MemberUncheckedCreateWithoutUserInput>;
};
export type MemberUpdateWithWhereUniqueWithoutUserInput = {
    where: Prisma.MemberWhereUniqueInput;
    data: Prisma.XOR<Prisma.MemberUpdateWithoutUserInput, Prisma.MemberUncheckedUpdateWithoutUserInput>;
};
export type MemberUpdateManyWithWhereWithoutUserInput = {
    where: Prisma.MemberScalarWhereInput;
    data: Prisma.XOR<Prisma.MemberUpdateManyMutationInput, Prisma.MemberUncheckedUpdateManyWithoutUserInput>;
};
export type MemberScalarWhereInput = {
    AND?: Prisma.MemberScalarWhereInput | Prisma.MemberScalarWhereInput[];
    OR?: Prisma.MemberScalarWhereInput[];
    NOT?: Prisma.MemberScalarWhereInput | Prisma.MemberScalarWhereInput[];
    id?: Prisma.StringFilter<"Member"> | string;
    organizationId?: Prisma.StringFilter<"Member"> | string;
    userId?: Prisma.StringFilter<"Member"> | string;
    role?: Prisma.StringFilter<"Member"> | string;
    createdAt?: Prisma.DateTimeFilter<"Member"> | Date | string;
};
export type MemberCreateWithoutOrganizationInput = {
    id: string;
    role: string;
    createdAt: Date | string;
    user: Prisma.UserCreateNestedOneWithoutMembersInput;
};
export type MemberUncheckedCreateWithoutOrganizationInput = {
    id: string;
    userId: string;
    role: string;
    createdAt: Date | string;
};
export type MemberCreateOrConnectWithoutOrganizationInput = {
    where: Prisma.MemberWhereUniqueInput;
    create: Prisma.XOR<Prisma.MemberCreateWithoutOrganizationInput, Prisma.MemberUncheckedCreateWithoutOrganizationInput>;
};
export type MemberCreateManyOrganizationInputEnvelope = {
    data: Prisma.MemberCreateManyOrganizationInput | Prisma.MemberCreateManyOrganizationInput[];
    skipDuplicates?: boolean;
};
export type MemberUpsertWithWhereUniqueWithoutOrganizationInput = {
    where: Prisma.MemberWhereUniqueInput;
    update: Prisma.XOR<Prisma.MemberUpdateWithoutOrganizationInput, Prisma.MemberUncheckedUpdateWithoutOrganizationInput>;
    create: Prisma.XOR<Prisma.MemberCreateWithoutOrganizationInput, Prisma.MemberUncheckedCreateWithoutOrganizationInput>;
};
export type MemberUpdateWithWhereUniqueWithoutOrganizationInput = {
    where: Prisma.MemberWhereUniqueInput;
    data: Prisma.XOR<Prisma.MemberUpdateWithoutOrganizationInput, Prisma.MemberUncheckedUpdateWithoutOrganizationInput>;
};
export type MemberUpdateManyWithWhereWithoutOrganizationInput = {
    where: Prisma.MemberScalarWhereInput;
    data: Prisma.XOR<Prisma.MemberUpdateManyMutationInput, Prisma.MemberUncheckedUpdateManyWithoutOrganizationInput>;
};
export type MemberCreateManyUserInput = {
    id: string;
    organizationId: string;
    role: string;
    createdAt: Date | string;
};
export type MemberUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    organization?: Prisma.OrganizationUpdateOneRequiredWithoutMembersNestedInput;
};
export type MemberUncheckedUpdateWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MemberUncheckedUpdateManyWithoutUserInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    organizationId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MemberCreateManyOrganizationInput = {
    id: string;
    userId: string;
    role: string;
    createdAt: Date | string;
};
export type MemberUpdateWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    user?: Prisma.UserUpdateOneRequiredWithoutMembersNestedInput;
};
export type MemberUncheckedUpdateWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MemberUncheckedUpdateManyWithoutOrganizationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    userId?: Prisma.StringFieldUpdateOperationsInput | string;
    role?: Prisma.StringFieldUpdateOperationsInput | string;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
};
export type MemberSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    organizationId?: boolean;
    userId?: boolean;
    role?: boolean;
    createdAt?: boolean;
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["member"]>;
export type MemberSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    organizationId?: boolean;
    userId?: boolean;
    role?: boolean;
    createdAt?: boolean;
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["member"]>;
export type MemberSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    organizationId?: boolean;
    userId?: boolean;
    role?: boolean;
    createdAt?: boolean;
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["member"]>;
export type MemberSelectScalar = {
    id?: boolean;
    organizationId?: boolean;
    userId?: boolean;
    role?: boolean;
    createdAt?: boolean;
};
export type MemberOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "organizationId" | "userId" | "role" | "createdAt", ExtArgs["result"]["member"]>;
export type MemberInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type MemberIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type MemberIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    organization?: boolean | Prisma.OrganizationDefaultArgs<ExtArgs>;
    user?: boolean | Prisma.UserDefaultArgs<ExtArgs>;
};
export type $MemberPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Member";
    objects: {
        organization: Prisma.$OrganizationPayload<ExtArgs>;
        user: Prisma.$UserPayload<ExtArgs>;
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        organizationId: string;
        userId: string;
        role: string;
        createdAt: Date;
    }, ExtArgs["result"]["member"]>;
    composites: {};
};
export type MemberGetPayload<S extends boolean | null | undefined | MemberDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$MemberPayload, S>;
export type MemberCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<MemberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: MemberCountAggregateInputType | true;
};
export interface MemberDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Member'];
        meta: {
            name: 'Member';
        };
    };
    findUnique<T extends MemberFindUniqueArgs>(args: Prisma.SelectSubset<T, MemberFindUniqueArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends MemberFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, MemberFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends MemberFindFirstArgs>(args?: Prisma.SelectSubset<T, MemberFindFirstArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends MemberFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, MemberFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends MemberFindManyArgs>(args?: Prisma.SelectSubset<T, MemberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends MemberCreateArgs>(args: Prisma.SelectSubset<T, MemberCreateArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends MemberCreateManyArgs>(args?: Prisma.SelectSubset<T, MemberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends MemberCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, MemberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends MemberDeleteArgs>(args: Prisma.SelectSubset<T, MemberDeleteArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends MemberUpdateArgs>(args: Prisma.SelectSubset<T, MemberUpdateArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends MemberDeleteManyArgs>(args?: Prisma.SelectSubset<T, MemberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends MemberUpdateManyArgs>(args: Prisma.SelectSubset<T, MemberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends MemberUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, MemberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends MemberUpsertArgs>(args: Prisma.SelectSubset<T, MemberUpsertArgs<ExtArgs>>): Prisma.Prisma__MemberClient<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends MemberCountArgs>(args?: Prisma.Subset<T, MemberCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], MemberCountAggregateOutputType> : number>;
    aggregate<T extends MemberAggregateArgs>(args: Prisma.Subset<T, MemberAggregateArgs>): Prisma.PrismaPromise<GetMemberAggregateType<T>>;
    groupBy<T extends MemberGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: MemberGroupByArgs['orderBy'];
    } : {
        orderBy?: MemberGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, MemberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMemberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: MemberFieldRefs;
}
export interface Prisma__MemberClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    organization<T extends Prisma.OrganizationDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.OrganizationDefaultArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    user<T extends Prisma.UserDefaultArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.UserDefaultArgs<ExtArgs>>): Prisma.Prisma__UserClient<runtime.Types.Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface MemberFieldRefs {
    readonly id: Prisma.FieldRef<"Member", 'String'>;
    readonly organizationId: Prisma.FieldRef<"Member", 'String'>;
    readonly userId: Prisma.FieldRef<"Member", 'String'>;
    readonly role: Prisma.FieldRef<"Member", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Member", 'DateTime'>;
}
export type MemberFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    where: Prisma.MemberWhereUniqueInput;
};
export type MemberFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    where: Prisma.MemberWhereUniqueInput;
};
export type MemberFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    where?: Prisma.MemberWhereInput;
    orderBy?: Prisma.MemberOrderByWithRelationInput | Prisma.MemberOrderByWithRelationInput[];
    cursor?: Prisma.MemberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MemberScalarFieldEnum | Prisma.MemberScalarFieldEnum[];
};
export type MemberFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    where?: Prisma.MemberWhereInput;
    orderBy?: Prisma.MemberOrderByWithRelationInput | Prisma.MemberOrderByWithRelationInput[];
    cursor?: Prisma.MemberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MemberScalarFieldEnum | Prisma.MemberScalarFieldEnum[];
};
export type MemberFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    where?: Prisma.MemberWhereInput;
    orderBy?: Prisma.MemberOrderByWithRelationInput | Prisma.MemberOrderByWithRelationInput[];
    cursor?: Prisma.MemberWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.MemberScalarFieldEnum | Prisma.MemberScalarFieldEnum[];
};
export type MemberCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MemberCreateInput, Prisma.MemberUncheckedCreateInput>;
};
export type MemberCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.MemberCreateManyInput | Prisma.MemberCreateManyInput[];
    skipDuplicates?: boolean;
};
export type MemberCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    data: Prisma.MemberCreateManyInput | Prisma.MemberCreateManyInput[];
    skipDuplicates?: boolean;
    include?: Prisma.MemberIncludeCreateManyAndReturn<ExtArgs> | null;
};
export type MemberUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MemberUpdateInput, Prisma.MemberUncheckedUpdateInput>;
    where: Prisma.MemberWhereUniqueInput;
};
export type MemberUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.MemberUpdateManyMutationInput, Prisma.MemberUncheckedUpdateManyInput>;
    where?: Prisma.MemberWhereInput;
    limit?: number;
};
export type MemberUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.MemberUpdateManyMutationInput, Prisma.MemberUncheckedUpdateManyInput>;
    where?: Prisma.MemberWhereInput;
    limit?: number;
    include?: Prisma.MemberIncludeUpdateManyAndReturn<ExtArgs> | null;
};
export type MemberUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    where: Prisma.MemberWhereUniqueInput;
    create: Prisma.XOR<Prisma.MemberCreateInput, Prisma.MemberUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.MemberUpdateInput, Prisma.MemberUncheckedUpdateInput>;
};
export type MemberDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
    where: Prisma.MemberWhereUniqueInput;
};
export type MemberDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MemberWhereInput;
    limit?: number;
};
export type MemberDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.MemberSelect<ExtArgs> | null;
    omit?: Prisma.MemberOmit<ExtArgs> | null;
    include?: Prisma.MemberInclude<ExtArgs> | null;
};
