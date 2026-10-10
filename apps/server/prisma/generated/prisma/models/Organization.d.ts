import type * as runtime from "@prisma/client/runtime/client";
import type * as Prisma from "../internal/prismaNamespace.js";
export type OrganizationModel = runtime.Types.Result.DefaultSelection<Prisma.$OrganizationPayload>;
export type AggregateOrganization = {
    _count: OrganizationCountAggregateOutputType | null;
    _min: OrganizationMinAggregateOutputType | null;
    _max: OrganizationMaxAggregateOutputType | null;
};
export type OrganizationMinAggregateOutputType = {
    id: string | null;
    name: string | null;
    slug: string | null;
    logo: string | null;
    createdAt: Date | null;
    metadata: string | null;
};
export type OrganizationMaxAggregateOutputType = {
    id: string | null;
    name: string | null;
    slug: string | null;
    logo: string | null;
    createdAt: Date | null;
    metadata: string | null;
};
export type OrganizationCountAggregateOutputType = {
    id: number;
    name: number;
    slug: number;
    logo: number;
    createdAt: number;
    metadata: number;
    _all: number;
};
export type OrganizationMinAggregateInputType = {
    id?: true;
    name?: true;
    slug?: true;
    logo?: true;
    createdAt?: true;
    metadata?: true;
};
export type OrganizationMaxAggregateInputType = {
    id?: true;
    name?: true;
    slug?: true;
    logo?: true;
    createdAt?: true;
    metadata?: true;
};
export type OrganizationCountAggregateInputType = {
    id?: true;
    name?: true;
    slug?: true;
    logo?: true;
    createdAt?: true;
    metadata?: true;
    _all?: true;
};
export type OrganizationAggregateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput | Prisma.OrganizationOrderByWithRelationInput[];
    cursor?: Prisma.OrganizationWhereUniqueInput;
    take?: number;
    skip?: number;
    _count?: true | OrganizationCountAggregateInputType;
    _min?: OrganizationMinAggregateInputType;
    _max?: OrganizationMaxAggregateInputType;
};
export type GetOrganizationAggregateType<T extends OrganizationAggregateArgs> = {
    [P in keyof T & keyof AggregateOrganization]: P extends '_count' | 'count' ? T[P] extends true ? number : Prisma.GetScalarType<T[P], AggregateOrganization[P]> : Prisma.GetScalarType<T[P], AggregateOrganization[P]>;
};
export type OrganizationGroupByArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithAggregationInput | Prisma.OrganizationOrderByWithAggregationInput[];
    by: Prisma.OrganizationScalarFieldEnum[] | Prisma.OrganizationScalarFieldEnum;
    having?: Prisma.OrganizationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: OrganizationCountAggregateInputType | true;
    _min?: OrganizationMinAggregateInputType;
    _max?: OrganizationMaxAggregateInputType;
};
export type OrganizationGroupByOutputType = {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    createdAt: Date;
    metadata: string | null;
    _count: OrganizationCountAggregateOutputType | null;
    _min: OrganizationMinAggregateOutputType | null;
    _max: OrganizationMaxAggregateOutputType | null;
};
export type GetOrganizationGroupByPayload<T extends OrganizationGroupByArgs> = Prisma.PrismaPromise<Array<Prisma.PickEnumerable<OrganizationGroupByOutputType, T['by']> & {
    [P in ((keyof T) & (keyof OrganizationGroupByOutputType))]: P extends '_count' ? T[P] extends boolean ? number : Prisma.GetScalarType<T[P], OrganizationGroupByOutputType[P]> : Prisma.GetScalarType<T[P], OrganizationGroupByOutputType[P]>;
}>>;
export type OrganizationWhereInput = {
    AND?: Prisma.OrganizationWhereInput | Prisma.OrganizationWhereInput[];
    OR?: Prisma.OrganizationWhereInput[];
    NOT?: Prisma.OrganizationWhereInput | Prisma.OrganizationWhereInput[];
    id?: Prisma.StringFilter<"Organization"> | string;
    name?: Prisma.StringFilter<"Organization"> | string;
    slug?: Prisma.StringFilter<"Organization"> | string;
    logo?: Prisma.StringNullableFilter<"Organization"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Organization"> | Date | string;
    metadata?: Prisma.StringNullableFilter<"Organization"> | string | null;
    members?: Prisma.MemberListRelationFilter;
    invitations?: Prisma.InvitationListRelationFilter;
};
export type OrganizationOrderByWithRelationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    logo?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    metadata?: Prisma.SortOrderInput | Prisma.SortOrder;
    members?: Prisma.MemberOrderByRelationAggregateInput;
    invitations?: Prisma.InvitationOrderByRelationAggregateInput;
};
export type OrganizationWhereUniqueInput = Prisma.AtLeast<{
    id?: string;
    slug?: string;
    AND?: Prisma.OrganizationWhereInput | Prisma.OrganizationWhereInput[];
    OR?: Prisma.OrganizationWhereInput[];
    NOT?: Prisma.OrganizationWhereInput | Prisma.OrganizationWhereInput[];
    name?: Prisma.StringFilter<"Organization"> | string;
    logo?: Prisma.StringNullableFilter<"Organization"> | string | null;
    createdAt?: Prisma.DateTimeFilter<"Organization"> | Date | string;
    metadata?: Prisma.StringNullableFilter<"Organization"> | string | null;
    members?: Prisma.MemberListRelationFilter;
    invitations?: Prisma.InvitationListRelationFilter;
}, "id" | "slug">;
export type OrganizationOrderByWithAggregationInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    logo?: Prisma.SortOrderInput | Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    metadata?: Prisma.SortOrderInput | Prisma.SortOrder;
    _count?: Prisma.OrganizationCountOrderByAggregateInput;
    _max?: Prisma.OrganizationMaxOrderByAggregateInput;
    _min?: Prisma.OrganizationMinOrderByAggregateInput;
};
export type OrganizationScalarWhereWithAggregatesInput = {
    AND?: Prisma.OrganizationScalarWhereWithAggregatesInput | Prisma.OrganizationScalarWhereWithAggregatesInput[];
    OR?: Prisma.OrganizationScalarWhereWithAggregatesInput[];
    NOT?: Prisma.OrganizationScalarWhereWithAggregatesInput | Prisma.OrganizationScalarWhereWithAggregatesInput[];
    id?: Prisma.StringWithAggregatesFilter<"Organization"> | string;
    name?: Prisma.StringWithAggregatesFilter<"Organization"> | string;
    slug?: Prisma.StringWithAggregatesFilter<"Organization"> | string;
    logo?: Prisma.StringNullableWithAggregatesFilter<"Organization"> | string | null;
    createdAt?: Prisma.DateTimeWithAggregatesFilter<"Organization"> | Date | string;
    metadata?: Prisma.StringNullableWithAggregatesFilter<"Organization"> | string | null;
};
export type OrganizationCreateInput = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: Date | string;
    metadata?: string | null;
    members?: Prisma.MemberCreateNestedManyWithoutOrganizationInput;
    invitations?: Prisma.InvitationCreateNestedManyWithoutOrganizationInput;
};
export type OrganizationUncheckedCreateInput = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: Date | string;
    metadata?: string | null;
    members?: Prisma.MemberUncheckedCreateNestedManyWithoutOrganizationInput;
    invitations?: Prisma.InvitationUncheckedCreateNestedManyWithoutOrganizationInput;
};
export type OrganizationUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    members?: Prisma.MemberUpdateManyWithoutOrganizationNestedInput;
    invitations?: Prisma.InvitationUpdateManyWithoutOrganizationNestedInput;
};
export type OrganizationUncheckedUpdateInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    members?: Prisma.MemberUncheckedUpdateManyWithoutOrganizationNestedInput;
    invitations?: Prisma.InvitationUncheckedUpdateManyWithoutOrganizationNestedInput;
};
export type OrganizationCreateManyInput = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: Date | string;
    metadata?: string | null;
};
export type OrganizationUpdateManyMutationInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type OrganizationUncheckedUpdateManyInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
};
export type OrganizationCountOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    logo?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    metadata?: Prisma.SortOrder;
};
export type OrganizationMaxOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    logo?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    metadata?: Prisma.SortOrder;
};
export type OrganizationMinOrderByAggregateInput = {
    id?: Prisma.SortOrder;
    name?: Prisma.SortOrder;
    slug?: Prisma.SortOrder;
    logo?: Prisma.SortOrder;
    createdAt?: Prisma.SortOrder;
    metadata?: Prisma.SortOrder;
};
export type OrganizationScalarRelationFilter = {
    is?: Prisma.OrganizationWhereInput;
    isNot?: Prisma.OrganizationWhereInput;
};
export type OrganizationCreateNestedOneWithoutMembersInput = {
    create?: Prisma.XOR<Prisma.OrganizationCreateWithoutMembersInput, Prisma.OrganizationUncheckedCreateWithoutMembersInput>;
    connectOrCreate?: Prisma.OrganizationCreateOrConnectWithoutMembersInput;
    connect?: Prisma.OrganizationWhereUniqueInput;
};
export type OrganizationUpdateOneRequiredWithoutMembersNestedInput = {
    create?: Prisma.XOR<Prisma.OrganizationCreateWithoutMembersInput, Prisma.OrganizationUncheckedCreateWithoutMembersInput>;
    connectOrCreate?: Prisma.OrganizationCreateOrConnectWithoutMembersInput;
    upsert?: Prisma.OrganizationUpsertWithoutMembersInput;
    connect?: Prisma.OrganizationWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.OrganizationUpdateToOneWithWhereWithoutMembersInput, Prisma.OrganizationUpdateWithoutMembersInput>, Prisma.OrganizationUncheckedUpdateWithoutMembersInput>;
};
export type OrganizationCreateNestedOneWithoutInvitationsInput = {
    create?: Prisma.XOR<Prisma.OrganizationCreateWithoutInvitationsInput, Prisma.OrganizationUncheckedCreateWithoutInvitationsInput>;
    connectOrCreate?: Prisma.OrganizationCreateOrConnectWithoutInvitationsInput;
    connect?: Prisma.OrganizationWhereUniqueInput;
};
export type OrganizationUpdateOneRequiredWithoutInvitationsNestedInput = {
    create?: Prisma.XOR<Prisma.OrganizationCreateWithoutInvitationsInput, Prisma.OrganizationUncheckedCreateWithoutInvitationsInput>;
    connectOrCreate?: Prisma.OrganizationCreateOrConnectWithoutInvitationsInput;
    upsert?: Prisma.OrganizationUpsertWithoutInvitationsInput;
    connect?: Prisma.OrganizationWhereUniqueInput;
    update?: Prisma.XOR<Prisma.XOR<Prisma.OrganizationUpdateToOneWithWhereWithoutInvitationsInput, Prisma.OrganizationUpdateWithoutInvitationsInput>, Prisma.OrganizationUncheckedUpdateWithoutInvitationsInput>;
};
export type OrganizationCreateWithoutMembersInput = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: Date | string;
    metadata?: string | null;
    invitations?: Prisma.InvitationCreateNestedManyWithoutOrganizationInput;
};
export type OrganizationUncheckedCreateWithoutMembersInput = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: Date | string;
    metadata?: string | null;
    invitations?: Prisma.InvitationUncheckedCreateNestedManyWithoutOrganizationInput;
};
export type OrganizationCreateOrConnectWithoutMembersInput = {
    where: Prisma.OrganizationWhereUniqueInput;
    create: Prisma.XOR<Prisma.OrganizationCreateWithoutMembersInput, Prisma.OrganizationUncheckedCreateWithoutMembersInput>;
};
export type OrganizationUpsertWithoutMembersInput = {
    update: Prisma.XOR<Prisma.OrganizationUpdateWithoutMembersInput, Prisma.OrganizationUncheckedUpdateWithoutMembersInput>;
    create: Prisma.XOR<Prisma.OrganizationCreateWithoutMembersInput, Prisma.OrganizationUncheckedCreateWithoutMembersInput>;
    where?: Prisma.OrganizationWhereInput;
};
export type OrganizationUpdateToOneWithWhereWithoutMembersInput = {
    where?: Prisma.OrganizationWhereInput;
    data: Prisma.XOR<Prisma.OrganizationUpdateWithoutMembersInput, Prisma.OrganizationUncheckedUpdateWithoutMembersInput>;
};
export type OrganizationUpdateWithoutMembersInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    invitations?: Prisma.InvitationUpdateManyWithoutOrganizationNestedInput;
};
export type OrganizationUncheckedUpdateWithoutMembersInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    invitations?: Prisma.InvitationUncheckedUpdateManyWithoutOrganizationNestedInput;
};
export type OrganizationCreateWithoutInvitationsInput = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: Date | string;
    metadata?: string | null;
    members?: Prisma.MemberCreateNestedManyWithoutOrganizationInput;
};
export type OrganizationUncheckedCreateWithoutInvitationsInput = {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    createdAt: Date | string;
    metadata?: string | null;
    members?: Prisma.MemberUncheckedCreateNestedManyWithoutOrganizationInput;
};
export type OrganizationCreateOrConnectWithoutInvitationsInput = {
    where: Prisma.OrganizationWhereUniqueInput;
    create: Prisma.XOR<Prisma.OrganizationCreateWithoutInvitationsInput, Prisma.OrganizationUncheckedCreateWithoutInvitationsInput>;
};
export type OrganizationUpsertWithoutInvitationsInput = {
    update: Prisma.XOR<Prisma.OrganizationUpdateWithoutInvitationsInput, Prisma.OrganizationUncheckedUpdateWithoutInvitationsInput>;
    create: Prisma.XOR<Prisma.OrganizationCreateWithoutInvitationsInput, Prisma.OrganizationUncheckedCreateWithoutInvitationsInput>;
    where?: Prisma.OrganizationWhereInput;
};
export type OrganizationUpdateToOneWithWhereWithoutInvitationsInput = {
    where?: Prisma.OrganizationWhereInput;
    data: Prisma.XOR<Prisma.OrganizationUpdateWithoutInvitationsInput, Prisma.OrganizationUncheckedUpdateWithoutInvitationsInput>;
};
export type OrganizationUpdateWithoutInvitationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    members?: Prisma.MemberUpdateManyWithoutOrganizationNestedInput;
};
export type OrganizationUncheckedUpdateWithoutInvitationsInput = {
    id?: Prisma.StringFieldUpdateOperationsInput | string;
    name?: Prisma.StringFieldUpdateOperationsInput | string;
    slug?: Prisma.StringFieldUpdateOperationsInput | string;
    logo?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    metadata?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
    members?: Prisma.MemberUncheckedUpdateManyWithoutOrganizationNestedInput;
};
export type OrganizationCountOutputType = {
    members: number;
    invitations: number;
};
export type OrganizationCountOutputTypeSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    members?: boolean | OrganizationCountOutputTypeCountMembersArgs;
    invitations?: boolean | OrganizationCountOutputTypeCountInvitationsArgs;
};
export type OrganizationCountOutputTypeDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationCountOutputTypeSelect<ExtArgs> | null;
};
export type OrganizationCountOutputTypeCountMembersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.MemberWhereInput;
};
export type OrganizationCountOutputTypeCountInvitationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.InvitationWhereInput;
};
export type OrganizationSelect<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    logo?: boolean;
    createdAt?: boolean;
    metadata?: boolean;
    members?: boolean | Prisma.Organization$membersArgs<ExtArgs>;
    invitations?: boolean | Prisma.Organization$invitationsArgs<ExtArgs>;
    _count?: boolean | Prisma.OrganizationCountOutputTypeDefaultArgs<ExtArgs>;
}, ExtArgs["result"]["organization"]>;
export type OrganizationSelectCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    logo?: boolean;
    createdAt?: boolean;
    metadata?: boolean;
}, ExtArgs["result"]["organization"]>;
export type OrganizationSelectUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetSelect<{
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    logo?: boolean;
    createdAt?: boolean;
    metadata?: boolean;
}, ExtArgs["result"]["organization"]>;
export type OrganizationSelectScalar = {
    id?: boolean;
    name?: boolean;
    slug?: boolean;
    logo?: boolean;
    createdAt?: boolean;
    metadata?: boolean;
};
export type OrganizationOmit<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = runtime.Types.Extensions.GetOmit<"id" | "name" | "slug" | "logo" | "createdAt" | "metadata", ExtArgs["result"]["organization"]>;
export type OrganizationInclude<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    members?: boolean | Prisma.Organization$membersArgs<ExtArgs>;
    invitations?: boolean | Prisma.Organization$invitationsArgs<ExtArgs>;
    _count?: boolean | Prisma.OrganizationCountOutputTypeDefaultArgs<ExtArgs>;
};
export type OrganizationIncludeCreateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type OrganizationIncludeUpdateManyAndReturn<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {};
export type $OrganizationPayload<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    name: "Organization";
    objects: {
        members: Prisma.$MemberPayload<ExtArgs>[];
        invitations: Prisma.$InvitationPayload<ExtArgs>[];
    };
    scalars: runtime.Types.Extensions.GetPayloadResult<{
        id: string;
        name: string;
        slug: string;
        logo: string | null;
        createdAt: Date;
        metadata: string | null;
    }, ExtArgs["result"]["organization"]>;
    composites: {};
};
export type OrganizationGetPayload<S extends boolean | null | undefined | OrganizationDefaultArgs> = runtime.Types.Result.GetResult<Prisma.$OrganizationPayload, S>;
export type OrganizationCountArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = Omit<OrganizationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
    select?: OrganizationCountAggregateInputType | true;
};
export interface OrganizationDelegate<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: {
        types: Prisma.TypeMap<ExtArgs>['model']['Organization'];
        meta: {
            name: 'Organization';
        };
    };
    findUnique<T extends OrganizationFindUniqueArgs>(args: Prisma.SelectSubset<T, OrganizationFindUniqueArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findUniqueOrThrow<T extends OrganizationFindUniqueOrThrowArgs>(args: Prisma.SelectSubset<T, OrganizationFindUniqueOrThrowArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findFirst<T extends OrganizationFindFirstArgs>(args?: Prisma.SelectSubset<T, OrganizationFindFirstArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>;
    findFirstOrThrow<T extends OrganizationFindFirstOrThrowArgs>(args?: Prisma.SelectSubset<T, OrganizationFindFirstOrThrowArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    findMany<T extends OrganizationFindManyArgs>(args?: Prisma.SelectSubset<T, OrganizationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>;
    create<T extends OrganizationCreateArgs>(args: Prisma.SelectSubset<T, OrganizationCreateArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    createMany<T extends OrganizationCreateManyArgs>(args?: Prisma.SelectSubset<T, OrganizationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    createManyAndReturn<T extends OrganizationCreateManyAndReturnArgs>(args?: Prisma.SelectSubset<T, OrganizationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>;
    delete<T extends OrganizationDeleteArgs>(args: Prisma.SelectSubset<T, OrganizationDeleteArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    update<T extends OrganizationUpdateArgs>(args: Prisma.SelectSubset<T, OrganizationUpdateArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    deleteMany<T extends OrganizationDeleteManyArgs>(args?: Prisma.SelectSubset<T, OrganizationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateMany<T extends OrganizationUpdateManyArgs>(args: Prisma.SelectSubset<T, OrganizationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<Prisma.BatchPayload>;
    updateManyAndReturn<T extends OrganizationUpdateManyAndReturnArgs>(args: Prisma.SelectSubset<T, OrganizationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>;
    upsert<T extends OrganizationUpsertArgs>(args: Prisma.SelectSubset<T, OrganizationUpsertArgs<ExtArgs>>): Prisma.Prisma__OrganizationClient<runtime.Types.Result.GetResult<Prisma.$OrganizationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>;
    count<T extends OrganizationCountArgs>(args?: Prisma.Subset<T, OrganizationCountArgs>): Prisma.PrismaPromise<T extends runtime.Types.Utils.Record<'select', any> ? T['select'] extends true ? number : Prisma.GetScalarType<T['select'], OrganizationCountAggregateOutputType> : number>;
    aggregate<T extends OrganizationAggregateArgs>(args: Prisma.Subset<T, OrganizationAggregateArgs>): Prisma.PrismaPromise<GetOrganizationAggregateType<T>>;
    groupBy<T extends OrganizationGroupByArgs, HasSelectOrTake extends Prisma.Or<Prisma.Extends<'skip', Prisma.Keys<T>>, Prisma.Extends<'take', Prisma.Keys<T>>>, OrderByArg extends Prisma.True extends HasSelectOrTake ? {
        orderBy: OrganizationGroupByArgs['orderBy'];
    } : {
        orderBy?: OrganizationGroupByArgs['orderBy'];
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
    }[OrderFields]>(args: Prisma.SubsetIntersection<T, OrganizationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetOrganizationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>;
    readonly fields: OrganizationFieldRefs;
}
export interface Prisma__OrganizationClient<T, Null = never, ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise";
    members<T extends Prisma.Organization$membersArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Organization$membersArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$MemberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    invitations<T extends Prisma.Organization$invitationsArgs<ExtArgs> = {}>(args?: Prisma.Subset<T, Prisma.Organization$invitationsArgs<ExtArgs>>): Prisma.PrismaPromise<runtime.Types.Result.GetResult<Prisma.$InvitationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>;
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): runtime.Types.Utils.JsPromise<TResult1 | TResult2>;
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): runtime.Types.Utils.JsPromise<T | TResult>;
    finally(onfinally?: (() => void) | undefined | null): runtime.Types.Utils.JsPromise<T>;
}
export interface OrganizationFieldRefs {
    readonly id: Prisma.FieldRef<"Organization", 'String'>;
    readonly name: Prisma.FieldRef<"Organization", 'String'>;
    readonly slug: Prisma.FieldRef<"Organization", 'String'>;
    readonly logo: Prisma.FieldRef<"Organization", 'String'>;
    readonly createdAt: Prisma.FieldRef<"Organization", 'DateTime'>;
    readonly metadata: Prisma.FieldRef<"Organization", 'String'>;
}
export type OrganizationFindUniqueArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where: Prisma.OrganizationWhereUniqueInput;
};
export type OrganizationFindUniqueOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where: Prisma.OrganizationWhereUniqueInput;
};
export type OrganizationFindFirstArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput | Prisma.OrganizationOrderByWithRelationInput[];
    cursor?: Prisma.OrganizationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.OrganizationScalarFieldEnum | Prisma.OrganizationScalarFieldEnum[];
};
export type OrganizationFindFirstOrThrowArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput | Prisma.OrganizationOrderByWithRelationInput[];
    cursor?: Prisma.OrganizationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.OrganizationScalarFieldEnum | Prisma.OrganizationScalarFieldEnum[];
};
export type OrganizationFindManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where?: Prisma.OrganizationWhereInput;
    orderBy?: Prisma.OrganizationOrderByWithRelationInput | Prisma.OrganizationOrderByWithRelationInput[];
    cursor?: Prisma.OrganizationWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: Prisma.OrganizationScalarFieldEnum | Prisma.OrganizationScalarFieldEnum[];
};
export type OrganizationCreateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.OrganizationCreateInput, Prisma.OrganizationUncheckedCreateInput>;
};
export type OrganizationCreateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.OrganizationCreateManyInput | Prisma.OrganizationCreateManyInput[];
    skipDuplicates?: boolean;
};
export type OrganizationCreateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelectCreateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    data: Prisma.OrganizationCreateManyInput | Prisma.OrganizationCreateManyInput[];
    skipDuplicates?: boolean;
};
export type OrganizationUpdateArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    data: Prisma.XOR<Prisma.OrganizationUpdateInput, Prisma.OrganizationUncheckedUpdateInput>;
    where: Prisma.OrganizationWhereUniqueInput;
};
export type OrganizationUpdateManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    data: Prisma.XOR<Prisma.OrganizationUpdateManyMutationInput, Prisma.OrganizationUncheckedUpdateManyInput>;
    where?: Prisma.OrganizationWhereInput;
    limit?: number;
};
export type OrganizationUpdateManyAndReturnArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelectUpdateManyAndReturn<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    data: Prisma.XOR<Prisma.OrganizationUpdateManyMutationInput, Prisma.OrganizationUncheckedUpdateManyInput>;
    where?: Prisma.OrganizationWhereInput;
    limit?: number;
};
export type OrganizationUpsertArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where: Prisma.OrganizationWhereUniqueInput;
    create: Prisma.XOR<Prisma.OrganizationCreateInput, Prisma.OrganizationUncheckedCreateInput>;
    update: Prisma.XOR<Prisma.OrganizationUpdateInput, Prisma.OrganizationUncheckedUpdateInput>;
};
export type OrganizationDeleteArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
    where: Prisma.OrganizationWhereUniqueInput;
};
export type OrganizationDeleteManyArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    where?: Prisma.OrganizationWhereInput;
    limit?: number;
};
export type Organization$membersArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type Organization$invitationsArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
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
export type OrganizationDefaultArgs<ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = {
    select?: Prisma.OrganizationSelect<ExtArgs> | null;
    omit?: Prisma.OrganizationOmit<ExtArgs> | null;
    include?: Prisma.OrganizationInclude<ExtArgs> | null;
};
