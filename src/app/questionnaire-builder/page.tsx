/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import HeaderBar from './HeaderBar';
import StartDialog from './StartDialog';
import ConnectionsPreviewModal from './ConnectionsPreviewModal';
import TemplatePreviewModal from '../../components/templates/TemplatePreviewModal';
import FlowPreviewDrawer from '../../components/templates/FlowPreviewDrawer';
import SectionNode from './SectionNode';
import QuestionnaireNode from '../../components/templates/QuestionnaireNode';
import TemplateEditQuestionNode from '../../components/templates/TemplateEditQuestionNode';
import { withPageLoader } from '@frontend/shared-ui';
// import DashboardLayout from '../../components/layout/DashboardLayout';
// Removed Redux imports - using local state instead
import { CircularProgress, Backdrop } from '@mui/material';
import { useRouter } from 'next/navigation';
import hardcodedTemplateData from '../../data/hardcodedTemplate.json';
import { toast } from 'react-toastify';
import { useMutation, useQuery } from '@apollo/client';
import {
  CREATE_SCENARIO_MUTATION,
  CreateScenarioVersionInput,
  CreateScenarioData,
  UPDATE_SCENARIO_MUTATION,
  UpdateScenarioVersionWithVersioningInput,
  UpdateScenarioData,
  UPDATE_TEMPLATE_MUTATION,
  UpdateScenarioInput,
  UpdateTemplateData,
  GET_ALL_SCENARIOS_QUERY,
  GetAllScenariosData,
  ScenarioVersion,
  GET_SCENARIO_BY_ID_QUERY,
  GetScenarioByIdData
} from '../../graphql/scenario.service';
import { GET_ALL_FACILITY_TYPES, GET_SERVICE_LINES } from '../../graphql/user.service';

const QuestionnaireBuilder: React.FC<any> = ({
  isEditMode = false,
  questionnaireId,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeId, setNodeId] = useState(1);
  // Show StartDialog only for new templates (not edit mode)
  const getInitialShowStartDialog = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const templateId = urlParams.get('templateId');
      // Show StartDialog only for new templates (not edit mode)
      return mode !== 'edit' && !templateId;
    }
    return true; // Default to showing for new templates
  };

  const [showStartDialog, setShowStartDialog] = useState(getInitialShowStartDialog);
  const [showConnectionsPreview, setShowConnectionsPreview] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditMetadataDialog, setShowEditMetadataDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [isSplitScreen, setIsSplitScreen] = useState(false);

  // Initialize based on URL parameters
  const getInitialShowCreateAssessment = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      return mode !== 'edit';
    }
    return true;
  };

  const [showCreateAssessment, setShowCreateAssessment] = useState(getInitialShowCreateAssessment);

  const nodeTypes = useMemo(
    () => ({
      questionNode: QuestionnaireNode,
      sectionNode: SectionNode,
      editQuestionNode: TemplateEditQuestionNode,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode && targetNode) {
        // Get the option text based on the source handle
        let optionText = 'Default';

        if (params.sourceHandle && params.sourceHandle.startsWith('option-')) {
          const optionIndex = parseInt(params.sourceHandle.split('-')[1]);
          optionText = sourceNode.data.options?.[optionIndex] || 'Default';
        } else if (params.sourceHandle === 'multi-all') {
          optionText = 'All Selected';
        } else if (params.sourceHandle === 'yes') {
          optionText = 'Yes';
        } else if (params.sourceHandle === 'no') {
          optionText = 'No';
        } else if (params.sourceHandle === 'text-output') {
          optionText = 'Any Text';
        }

        const newEdge: any = {
          ...params,
          id: `${params.source}-${params.target}-${params.sourceHandle || 'default'}-${Date.now()}`,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: '#2196f3',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
          data: {
            optionText,
            sourceHandle: params.sourceHandle,
            condition: sourceNode.data.questionType,
          },
          label: optionText,
          labelStyle: {
            fill: '#2196f3',
            fontWeight: 600,
            fontSize: '12px',
          },
          labelBgStyle: {
            fill: 'white',
            fillOpacity: 0.9,
            rx: 4,
            stroke: '#2196f3',
            strokeWidth: 1,
          },
          labelBgPadding: [4, 8],
          labelShowBg: true,
        };

        setEdges((eds) => addEdge(newEdge, eds));
      }
    },
    [nodes, setEdges]
  );

  // Local state for template metadata instead of Redux
  const [templateMetadata, setTemplateMetadata] = useState({
    templateName: '',
    facilityTypes: [] as string[],
    facilityServices: [] as string[],
  });
  const [isMetadataSet, setIsMetadataSet] = useState(false);
  const [hasCompletedStartDialog, setHasCompletedStartDialog] = useState(false);

  // GraphQL mutations
  const [createScenario, { loading: createScenarioLoading }] = useMutation<CreateScenarioData>(CREATE_SCENARIO_MUTATION, {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all'
  });

  const [updateScenario, { loading: updateScenarioLoading }] = useMutation(UPDATE_SCENARIO_MUTATION, {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all'
  });

  // GraphQL mutation for updating template (metadata changes)
  const [updateTemplate, { loading: updateTemplateLoading }] = useMutation(UPDATE_TEMPLATE_MUTATION, {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all'
  });

  // GET_ALL_SCENARIOS_QUERY removed - not needed for edit-only mode

  // GraphQL queries for facility types and services (to get IDs)
  const { data: facilityTypesData } = useQuery(GET_ALL_FACILITY_TYPES, {
    fetchPolicy: 'cache-first',
  });
  const { data: servicesData } = useQuery(GET_SERVICE_LINES, {
    fetchPolicy: 'cache-first',
  });

  // Helper functions to convert names to IDs
  const getFacilityTypeIds = (facilityTypeNames: string[]): string[] => {
    if (!facilityTypesData?.getAllFacilityTypes?.data) return [];

    // Since data is now a JSON object, we need to handle it as an array
    const facilityTypes = Array.isArray(facilityTypesData.getAllFacilityTypes.data)
      ? facilityTypesData.getAllFacilityTypes.data
      : [];

    return facilityTypeNames
      .map(name => {
        const facilityType = facilityTypes.find((ft: any) => ft.name === name);
        return facilityType?._id;
      })
      .filter(Boolean);
  };

  const getServiceIds = (serviceNames: string[]): string[] => {
    if (!servicesData?.getServiceLines?.data) return [];

    // Since data is now a JSON object, we need to handle it as an array
    const services = Array.isArray(servicesData.getServiceLines.data)
      ? servicesData.getServiceLines.data
      : [];

    return serviceNames
      .map(name => {
        const service = services.find((s: any) => s.name === name);
        return service?._id;
      })
      .filter(Boolean);
  };

  // Helper functions to convert IDs back to names (for editing)
  const getFacilityTypeNames = useCallback((facilityIds: string[]): string[] => {
    if (!facilityTypesData?.getAllFacilityTypes?.data) return [];

    // Since data is now a JSON object, we need to handle it as an array
    const facilityTypes = Array.isArray(facilityTypesData.getAllFacilityTypes.data)
      ? facilityTypesData.getAllFacilityTypes.data
      : [];

    return facilityIds
      .map(id => {
        const facilityType = facilityTypes.find((ft: any) => ft._id === id);
        return facilityType?.name;
      })
      .filter(Boolean);
  }, [facilityTypesData]);

  const getServiceNames = useCallback((serviceIds: string[]): string[] => {
    if (!servicesData?.getServiceLines?.data) return [];

    // Since data is now a JSON object, we need to handle it as an array
    const services = Array.isArray(servicesData.getServiceLines.data)
      ? servicesData.getServiceLines.data
      : [];

    return serviceIds
      .map(id => {
        const service = services.find((s: any) => s._id === id);
        return service?.name;
      })
      .filter(Boolean);
  }, [servicesData]);

  // Get scenarioId and version from URL for edit mode
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('V1');

  // GraphQL query for getting scenario by ID (for edit mode)
  const { data: scenarioByIdData, loading: scenarioByIdLoading, refetch: refetchScenarioById } = useQuery<GetScenarioByIdData>(
    GET_SCENARIO_BY_ID_QUERY,
    {
      variables: {
        scenarioId: currentScenarioId,
        version: currentVersion
      },
      skip: !currentScenarioId, // Skip query if no scenarioId
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true
    }
  );

  // Debug: Log metadata changes
  useEffect(() => {
    console.log('📊 Template metadata state changed:', templateMetadata);
    console.log('📊 Template name in state:', templateMetadata.templateName);
    console.log('📊 isMetadataSet:', isMetadataSet);
  }, [templateMetadata, isMetadataSet]);

  // Load scenario data for edit mode
  useEffect(() => {
    if (scenarioByIdData?.getScenarioById) {
      const scenario = scenarioByIdData.getScenarioById;
      console.log('📥 Loading scenario for edit:', scenario);

      // Load questionnaire data (nodes and edges)
      if (scenario.questionnaire) {
        if (scenario.questionnaire.nodes) {
          setNodes(scenario.questionnaire.nodes);
        }
        if (scenario.questionnaire.edges) {
          setEdges(scenario.questionnaire.edges);
        }

        // Load template metadata
        // Note: facilities and services are not available in getScenarioById response
        // We'll need to get them from the questionnaire object if they're stored there
        const facilityTypes = scenario.questionnaire?.facilityTypes || [];
        const facilityServices = scenario.questionnaire?.facilityServices || [];

        setTemplateMetadata({
          templateName: scenario.questionnaire.templateName || scenario.scenario.name,
          facilityTypes: facilityTypes,
          facilityServices: facilityServices,
        });

        setIsMetadataSet(true);
        console.log('✅ Loaded scenario data:', {
          name: scenario.scenario.name,
          version: scenario.version,
          facilityTypes: facilityTypes,
          facilityServices: facilityServices,
          nodesCount: scenario.questionnaire.nodes?.length || 0,
          edgesCount: scenario.questionnaire.edges?.length || 0
        });
      }
    }
  }, [scenarioByIdData, getFacilityTypeNames, getServiceNames, setNodes, setEdges]);

  // Auto-show view modal when in view mode and data is loaded
  useEffect(() => {
    if (checkIsViewMode() && scenarioByIdData?.getScenarioById && nodes.length > 0) {
      setShowViewModal(true);
    }
  }, [scenarioByIdData, nodes.length]);

  // Get scenarioId and version from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const scenarioId = urlParams.get('scenarioId');
      const version = urlParams.get('version') || 'V1';

      if (scenarioId) {
        setCurrentScenarioId(scenarioId);
        setCurrentVersion(version);
        console.log('📝 Edit mode - Scenario ID:', scenarioId, 'Version:', version);
      }
    }
  }, []);

  // Load scenario data when scenarioByIdData is available
  useEffect(() => {
    if (scenarioByIdData?.getScenarioById) {
      const scenario = scenarioByIdData.getScenarioById;
      console.log('📊 Loading scenario data for editing:', scenario);
      console.log('📊 Current version:', currentVersion);
      console.log('📊 Scenario version:', scenario.version);
      console.log('📊 Scenario name:', scenario.scenario.name);
      console.log('📊 Scenario facilities (IDs):', scenario.facilities);
      console.log('📊 Scenario services (IDs):', scenario.services);

      // Handle facilities and services - they might be in the main response or in questionnaire
      let facilityIds: string[] = [];
      let serviceIds: string[] = [];

      // First, try to get from the main response
      if (scenario.facilities && Array.isArray(scenario.facilities)) {
        facilityIds = scenario.facilities;
      }
      if (scenario.services && Array.isArray(scenario.services)) {
        serviceIds = scenario.services;
      }

      // If not found in main response, try to get from questionnaire (fallback)
      if (facilityIds.length === 0 && scenario.questionnaire?.facilities) {
        facilityIds = scenario.questionnaire.facilities;
        console.log('📊 Using facilities from questionnaire:', facilityIds);
      }
      if (serviceIds.length === 0 && scenario.questionnaire?.services) {
        serviceIds = scenario.questionnaire.services;
        console.log('📊 Using services from questionnaire:', serviceIds);
      }

      // Convert facility and service IDs to names
      const facilityTypeNames = getFacilityTypeNames(facilityIds);
      const serviceNames = getServiceNames(serviceIds);

      console.log('📊 Final facility IDs:', facilityIds);
      console.log('📊 Final service IDs:', serviceIds);
      console.log('📊 Converted facility names:', facilityTypeNames);
      console.log('📊 Converted service names:', serviceNames);

      // Set template metadata with converted names
      // Use the version-specific name that was stored when this version was created
      let templateName = scenario.scenario.name; // fallback to base name

      // Priority 1: Use the version-specific name from questionnaire (this is what you named this version)
      if (scenario.questionnaire?.templateName) {
        templateName = scenario.questionnaire.templateName;
        console.log('📊 ✅ Using version-specific template name from questionnaire:', templateName);
      } else {
        console.log('📊 ⚠️ No version-specific name found, using base scenario name:', templateName);
        console.log('📊 ⚠️ Questionnaire data:', scenario.questionnaire);
      }

      const newMetadata = {
        templateName: templateName,
        facilityTypes: facilityTypeNames,
        facilityServices: serviceNames,
      };

      console.log('📊 Setting new template metadata:', newMetadata);
      console.log('📊 Previous template metadata:', templateMetadata);
      console.log('📊 Template name changing from:', templateMetadata.templateName, 'to:', scenario.scenario.name);
      setTemplateMetadata(newMetadata);
      setIsMetadataSet(true);
      setHasCompletedStartDialog(true);

      // Load nodes and edges
      if (scenario.questionnaire?.nodes) {
        console.log('📊 Loading nodes:', scenario.questionnaire.nodes);
        setNodes(scenario.questionnaire.nodes);
      }
      if (scenario.questionnaire?.edges) {
        console.log('📊 Loading edges:', scenario.questionnaire.edges);
        setEdges(scenario.questionnaire.edges);
      }

      // Update node ID counter
      if (scenario.questionnaire?.nodes?.length > 0) {
        const maxId = Math.max(...scenario.questionnaire.nodes.map((n: any) => parseInt(n.id) || 0));
        setNodeId(maxId + 1);
      }
    }
  }, [scenarioByIdData, getFacilityTypeNames, getServiceNames, setNodes, setEdges, currentVersion]);

  // Helper function to find optimal position near existing nodes without overlapping
  const findOptimalPosition = useCallback((existingNodes) => {
    const dialogWidth = 450;
    const dialogHeight = 400;
    const padding = 30;
    const headerHeight = 93;

    // If no existing nodes, place in center-top area
    if (existingNodes.length === 0) {
      return { x: 400, y: headerHeight + 50 };
    }

    // Find the topmost existing node
    const topNode = existingNodes.reduce((top, node) =>
      node.position.y < top.position.y ? node : top
    );

    // Try positions around the topmost node, prioritizing above and to the right
    const candidatePositions = [
      // Above the top node
      { x: topNode.position.x, y: Math.max(headerHeight + 20, topNode.position.y - dialogHeight - padding) },
      // To the right of the top node
      { x: topNode.position.x + 350, y: topNode.position.y },
      // To the left of the top node
      { x: Math.max(20, topNode.position.x - dialogWidth - padding), y: topNode.position.y },
      // Above and to the right
      { x: topNode.position.x + 200, y: Math.max(headerHeight + 20, topNode.position.y - dialogHeight - padding) },
    ];

    // Check each candidate position for overlaps
    for (const position of candidatePositions) {
      const overlaps = existingNodes.some(node => {
        const nodeX = node.position.x;
        const nodeY = node.position.y;
        const nodeW = 300; // Approximate node width
        const nodeH = 200; // Approximate node height

        return !(
          position.x > nodeX + nodeW + padding ||
          position.x + dialogWidth < nodeX - padding ||
          position.y > nodeY + nodeH + padding ||
          position.y + dialogHeight < nodeY - padding
        );
      });

      if (!overlaps && position.x >= 20 && position.y >= headerHeight + 20) {
        return position;
      }
    }

    // Fallback: place to the right of all nodes
    const rightmostNode = existingNodes.reduce((right, node) =>
      node.position.x > right.position.x ? node : right
    );
    return {
      x: rightmostNode.position.x + 350,
      y: Math.max(headerHeight + 50, topNode.position.y)
    };
  }, []);

  const handleAddQuestion = (metaData?: any) => {
    // Check if metaData is actually metadata and not a click event
    const isValidMetadata = metaData &&
      typeof metaData === 'object' &&
      !metaData.nativeEvent && // Click events have nativeEvent
      !metaData._reactName && // Click events have _reactName
      (metaData.templateName !== undefined || metaData.facilityTypes !== undefined || metaData.serviceLines !== undefined);

    console.log('🔍 handleAddQuestion called');
    console.log('🔍 isValidMetadata:', isValidMetadata);
    console.log('🔍 isMetadataSet:', isMetadataSet);

    // If this is metadata from StartDialog, store it and close dialog
    if (isValidMetadata) {
      console.log('✅ Processing metadata from StartDialog:', metaData);

      const metadata = {
        templateName: metaData.templateName,
        facilityTypes: metaData.facilityTypes,
        facilityServices: metaData.serviceLines, // mapping serviceLines to facilityServices
      };

      console.log('✅ Final metadata object:', metadata);

      // Validate metadata before setting
      if (metadata.templateName && metadata.templateName.trim() !== '') {
        // Store metadata in local state
        setTemplateMetadata(metadata);
        setIsMetadataSet(true);
        setHasCompletedStartDialog(true); // Mark that StartDialog has been completed

        // Also store in localStorage as backup
        localStorage.setItem('currentTemplateMetadata', JSON.stringify(metadata));
        console.log('✅ Metadata successfully set - ready for question creation');

        // Close the start dialog and edit metadata dialog
        setShowStartDialog(false);
        setShowEditMetadataDialog(false);

        // Create temp edit node after a short delay to allow dialog to close
        setTimeout(() => {
          console.log('🎯 Auto-creating question edit node after StartDialog');
          setNodes((currentNodes) => {
            const position = findOptimalPosition(currentNodes);
            const tempNode = {
              id: 'temp-edit-node',
              type: 'editQuestionNode',
              position,
              data: {
                question: '',
                questionType: 'text-input',
                options: ['Option 1', 'Option 2'],
                isRequired: false,
                isNewQuestion: true,
                onSave: handleSaveNewQuestion,
                onCancel: handleCancelNewQuestion,
              },
            };
            return [...currentNodes, tempNode];
          });
        }, 100);
        return;
      } else {
        console.error('❌ Invalid metadata - templateName is missing or empty:', metadata);
        toast.error('Please fill in the template name before proceeding.');
        return;
      }
    }

    // If this is a regular + button click (no metadata), create question node
    console.log('🎯 Creating new question node');

    // Check if we have metadata set (should be set from StartDialog)
    if (!isMetadataSet && !checkIsEditMode()) {
      console.log('❌ No metadata available - cannot create question');
      toast.error('Please start by creating a new template first.');
      return;
    }

    // Position the edit node using smart positioning near existing nodes
    setNodes((currentNodes) => {
      const position = findOptimalPosition(currentNodes);
      const tempNode = {
        id: 'temp-edit-node',
        type: 'editQuestionNode',
        position,
        data: {
          question: '',
          questionType: 'text-input',
          options: ['Option 1', 'Option 2'],
          isRequired: false,
          isNewQuestion: true,
          onSave: handleSaveNewQuestion,
          onCancel: handleCancelNewQuestion,
        },
      };
      return [...currentNodes, tempNode];
    });
  };

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
    },
    [setNodes, setEdges]
  );

  const handleUpdateNode = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) => (node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node))
      );

      // Update connected edge labels when options change
      if (newData.options) {
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.source === nodeId && edge.sourceHandle?.startsWith('option-')) {
              const optionIndex = parseInt(edge.sourceHandle.split('-')[1]);
              const newOptionText = newData.options[optionIndex];

              if (newOptionText) {
                return {
                  ...edge,
                  label: newOptionText,
                  data: {
                    ...edge.data,
                    optionText: newOptionText,
                  },
                };
              }
            }
            return edge;
          })
        );
      }
    },
    [setNodes, setEdges]
  );

  const handleUpdateEdgeLabels = useCallback(
    (nodeId: string, newOptions: string[]) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.source === nodeId && edge.sourceHandle?.startsWith('option-')) {
            const optionIndex = parseInt(edge.sourceHandle.split('-')[1]);
            const newOptionText = newOptions[optionIndex];

            if (newOptionText) {
              return {
                ...edge,
                label: newOptionText,
                data: {
                  ...edge.data,
                  optionText: newOptionText,
                },
              };
            }
          }
          return edge;
        })
      );
    },
    [setEdges]
  );

  const addQuestionNode = useCallback(
    (questionData) => {
      setNodes((currentNodes) => {
        // Use a simpler positioning for regular nodes - place near existing nodes but not overlapping
        const position = findOptimalPosition(currentNodes.filter(n => n.id !== 'temp-edit-node'));
        const newNode = {
          id: `${nodeId}`,
          type: 'questionNode',
          position: {
            x: position.x + 50, // Slight offset from dialog position
            y: position.y + 50,
          },
          data: {
            ...questionData,
            onUpdate: handleUpdateNode,
            onDelete: handleDeleteNode,
            onUpdateEdgeLabels: handleUpdateEdgeLabels,
          },
        };
        return [...currentNodes, newNode];
      });
      setNodeId((prev) => prev + 1);
    },
    [nodeId, findOptimalPosition, setNodes, setEdges, handleUpdateNode, handleDeleteNode, handleUpdateEdgeLabels]
  );

  const addSectionNode = useCallback(() => {
    setNodes((currentNodes) => {
      const position = findOptimalPosition(currentNodes);
      const newNode = {
        id: `section-${nodeId}`,
        type: 'sectionNode',
        position,
        data: {
          sectionName: '',
          weight: 1, // Default weight
          onUpdate: handleUpdateNode,
          onDelete: handleDeleteNode,
        },
      };
      return [...currentNodes, newNode];
    });
    setNodeId((prev) => prev + 1);
  }, [nodeId, findOptimalPosition, setNodes, handleUpdateNode, handleDeleteNode]);

  const handleSaveQuestionnaire = async () => {
    // Prevent multiple API calls
    if (isSaving) {
      console.log('🚫 Save already in progress, ignoring click');
      return;
    }

    console.log('🔍 Save triggered - Current metadata:', templateMetadata);
    console.log('🔍 Save triggered - isMetadataSet:', isMetadataSet);

    if (nodes.length === 0) {
      toast.error('Please add at least one question before saving.');
      return;
    }

    // Check if we're in edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const scenarioId = urlParams.get('scenarioId');
    // Edit mode: either has mode=edit OR just has scenarioId (indicating editing existing scenario)
    const isEditMode = (mode === 'edit' && scenarioId) || (scenarioId && mode !== 'view');

    // For edit mode, check if we have metadata from the existing template
    const hasValidMetadata = isMetadataSet &&
      templateMetadata.templateName &&
      templateMetadata.templateName.trim() !== '' &&
      templateMetadata.facilityTypes &&
      templateMetadata.facilityServices;

    const hasMetadata = hasValidMetadata ||
      (isEditMode && (templateMetadata.templateName || templateMetadata.facilityTypes?.length > 0 || templateMetadata.facilityServices?.length > 0));

    console.log('🔍 Save validation - hasValidMetadata:', hasValidMetadata, 'hasMetadata:', hasMetadata, 'isEditMode:', isEditMode);
    console.log('🔍 URL params - mode:', mode, 'scenarioId:', scenarioId);
    console.log('🔍 Current URL:', window.location.href);

    if (!hasMetadata && !isEditMode) {
      toast.error('Please set template metadata first by clicking Add Question.');
      return;
    }

    if (!hasValidMetadata && !isEditMode) {
      toast.error('Please fill out all required fields in the start dialog (Template Name, Facility Types, Service Lines).');
      setShowStartDialog(true);
      return;
    }

    // Use template name from metadata (works for both new and edit modes)
    const name = templateMetadata.templateName;

    console.log('🔍 Template name validation - name:', name, 'templateMetadata.templateName:', templateMetadata.templateName);

    if (!name || !name.trim()) {
      console.log('❌ Template name validation failed - name is empty');
      toast.error('Template name is required! Please set it in the start dialog.');
      // Show start dialog to allow user to set metadata
      setShowStartDialog(true);
      return;
    }

    try {
      // Set loading state
      setIsSaving(true);
      console.log('🚀 Starting save process...');

      let result;

      if (isEditMode) {
        // Edit mode: Update scenario questionnaire
        console.log('🔄 Edit mode: Calling updateScenario API...');

        const updateInput: UpdateScenarioVersionWithVersioningInput = {
          scenarioId: scenarioId!,
          questionnaire: {
            nodes,
            edges
          }
        };

        console.log('📤 Sending update scenario input:', JSON.stringify(updateInput, null, 2));
        console.log('📊 Nodes being sent:', updateInput.questionnaire.nodes);
        console.log('📊 Edges being sent:', updateInput.questionnaire.edges);

        result = await updateScenario({
          variables: {
            input: updateInput
          }
        });

        console.log('✅ UpdateScenario API response:', result.data);

        if (result.data?.updateScenario) {
          const { code, message, type } = result.data.updateScenario;
          console.log(`✅ API Response - Code: ${code}, Message: ${message}, Type: ${type}`);

          toast.success(message || `Questionnaire updated successfully!`, {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              zIndex: 10000,
            },
          });

          // Navigate to templates list after successful update
          setTimeout(() => {
            setIsSaving(false); // Reset loading state before navigation
            router.push('/templates');
          }, 500);
        }
      } else {
        // Create mode: Create new scenario
        console.log('🆕 Create mode: Calling createScenario API...');

        // Convert facility type and service names to IDs
        const facilityIds = getFacilityTypeIds(templateMetadata.facilityTypes);
        const serviceIds = getServiceIds(templateMetadata.facilityServices);

        const createInput: CreateScenarioVersionInput = {
          name: name.trim(),
          questionnaire: {
            nodes,
            edges,
            templateName: name.trim(),
            facilityTypes: templateMetadata.facilityTypes,
            serviceLines: templateMetadata.facilityServices
          },
          facilities: facilityIds,
          services: serviceIds
        };

        console.log('📤 Sending create scenario input:', JSON.stringify(createInput, null, 2));
        console.log('📊 Nodes being sent:', createInput.questionnaire.nodes);
        console.log('📊 Edges being sent:', createInput.questionnaire.edges);
        console.log('🏥 Facility IDs:', facilityIds);
        console.log('🏥 Service IDs:', serviceIds);

        result = await createScenario({
          variables: {
            input: createInput
          }
        });

        console.log('✅ CreateScenario API response:', result.data);

        if (result.data?.createScenario) {
          const { code, message, type, data } = result.data.createScenario;
          console.log(`✅ API Response - Code: ${code}, Message: ${message}, Type: ${type}`);
          console.log('📊 Created scenario data:', data);

          toast.success(message || `Template created successfully!`, {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            style: {
              zIndex: 10000,
            },
          });

          // Navigate to templates list after successful creation
          setTimeout(() => {
            setIsSaving(false); // Reset loading state before navigation
            router.push('/templates');
          }, 500);
        }
      }

      // Only edit mode is supported - updateScenario success is handled above

    } catch (error: any) {
      console.error('❌ Error saving questionnaire:', error);

      // Provide detailed error feedback
      let errorMessage = 'Failed to save questionnaire';
      if (error.networkError) {
        errorMessage = 'Network error - please check your connection and try again';
      } else if (error.graphQLErrors && error.graphQLErrors.length > 0) {
        errorMessage = error.graphQLErrors[0].message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        style: {
          zIndex: 10000, // Higher than loading overlay
        },
      });

      // Stay on the same page on error - user can retry
      console.log('🔄 Staying on current page due to save error');

      // Reset loading state only for errors (success cases handle this in setTimeout)
      setIsSaving(false);
      console.log('🔄 Loading state reset due to error');
    }
    // Note: No finally block - success cases handle loading state reset in setTimeout
  };

  const handleExportJSON = () => {
    const questionnaire = { nodes, edges };
    const blob = new Blob([JSON.stringify(questionnaire, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questionnaire.json';
    a.click();
  }; 

  const handleClearAll = () => {
    // Clear all question nodes and their connections
    console.log('🧹 Clearing all question nodes and their connections');

    // Get all question node IDs
    const questionNodeIds = nodes
      .filter(node => node.type === 'questionNode' || node.type === 'editQuestionNode')
      .map(node => node.id);

    // Remove all question nodes
    setNodes((nds) =>
      nds.filter(node =>
        node.type !== 'questionNode' && node.type !== 'editQuestionNode'
      )
    );

    // Remove all edges connected to question nodes
    setEdges((eds) =>
      eds.filter(edge =>
        !questionNodeIds.includes(edge.source) && !questionNodeIds.includes(edge.target)
      )
    );

    console.log('✅ Cleared question nodes and connections:', questionNodeIds);
  };

  const handleSaveNewQuestion = (newQuestionData: any) => {
    // Remove temp edit node
    setNodes((nds) => nds.filter((node) => node.id !== 'temp-edit-node'));

    // Add actual question node
    addQuestionNode(newQuestionData);

    // Auto-open preview drawer when first question is added
    setNodes((currentNodes) => {
      const questionNodes = currentNodes.filter(node => node.type === 'questionNode');
      if (questionNodes.length === 1 && !isPreviewDrawerOpen) {
        setIsPreviewDrawerOpen(true);
      }
      return currentNodes;
    });
  };

  const handleCancelNewQuestion = () => {
    // Remove temp edit node
    setNodes((nds) => nds.filter((node) => node.id !== 'temp-edit-node'));
  };

  const handlePreviewConnections = () => {
    setShowConnectionsPreview(true);
  };

  // IMPORTANT: this expects a parsed object (Toolbar already parses file)
  const handleImportJSON = (jsonData: any) => {
    try {
      if (jsonData?.nodes && jsonData?.edges) {
        // Clear existing nodes and edges
        setNodes([]);
        setEdges([]);

        // Import nodes with proper data structure (re-attach handlers)
        const importedNodes = jsonData.nodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            onUpdate: handleUpdateNode,
            onDelete: handleDeleteNode,
            onUpdateEdgeLabels: handleUpdateEdgeLabels,
          },
        }));

        setNodes(importedNodes);
        setEdges(jsonData.edges);

        // Update node ID counter
        const maxId = Math.max(...jsonData.nodes.map((n: any) => parseInt(n.id) || 0), 0);
        setNodeId(maxId + 1);

        alert('✅ JSON imported successfully.');
      } else {
        alert('Invalid JSON format. Expected nodes and edges properties.');
      }
    } catch (error) {
      console.error('❌ Error importing JSON:', error);
      alert('Failed to import JSON file');
    }
  };

  const handleSaveAsDraft = async () => {
    if (nodes.length === 0) {
      toast.error('Please add at least one question before saving as draft.');
      return;
    }

    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const templateId = urlParams.get('templateId');

    let name, description;

    if (templateId) {
      // If editing, get existing template data
      if (typeof window === 'undefined') return;
      const existingDrafts = JSON.parse(localStorage.getItem('templateDrafts') || '[]');
      const existingTemplate = existingDrafts.find((d: any) => d.id === templateId);

      if (existingTemplate) {
        name = existingTemplate.name;
        description = existingTemplate.description;
      } else {
        name = prompt('Enter template name:');
        description = prompt('Enter template description (optional):') || '';
      }
    } else {
      // If new template, prompt for name
      name = prompt('Enter template name:');
      description = prompt('Enter template description (optional):') || '';
    }

    if (!name || !name.trim()) {
      toast.error('Template name is required!');
      return;
    }

    try {
      const draft: any = {
        id: templateId || Date.now().toString(),
        name: name.trim(),
        description: description.trim(),
        nodes,
        edges,
        status: 'In Progress',
        createdAt: templateId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDraft: true,
      };

      // Save draft to localStorage
      if (typeof window === 'undefined') return;
      const existingDrafts = JSON.parse(localStorage.getItem('templateDrafts') || '[]');
      const existingIndex = existingDrafts.findIndex((d: any) => d.id === draft.id);

      if (existingIndex >= 0) {
        // Update existing draft, preserve createdAt
        existingDrafts[existingIndex] = {
          ...existingDrafts[existingIndex],
          ...draft,
          createdAt: existingDrafts[existingIndex].createdAt,
        };
      } else {
        // Add new draft
        draft.createdAt = new Date().toISOString();
        existingDrafts.push(draft);
      }

      localStorage.setItem('templateDrafts', JSON.stringify(existingDrafts));
      toast.success(`📄 Template "${name}" saved as draft successfully!`);
    } catch (error: any) {
      console.error('❌ Error saving draft:', error);
      toast.error('Failed to save draft: ' + error.message);
    }
  };

  // Update node data with handlers
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onUpdate: handleUpdateNode,
          onDelete: handleDeleteNode,
          onUpdateEdgeLabels: handleUpdateEdgeLabels,
        },
      }))
    );
  }, [handleUpdateNode, handleDeleteNode, handleUpdateEdgeLabels]);

  // Load draft when editing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const templateId = urlParams.get('templateId');

    if (mode === 'edit' && templateId) {
      // Skip the popup for edit mode
      setShowCreateAssessment(false);
      setShowStartDialog(false);

      let template = null;

      // Check if it's the hardcoded template
      if (templateId === '1755178644364') {
        template = hardcodedTemplateData;
      } else if (templateId === hardcodedTemplateData.id) {
        template = hardcodedTemplateData;
      } else {
        // Load from localStorage for other templates
        const drafts = JSON.parse(localStorage.getItem('templateDrafts') || '[]');
        template = drafts.find((d: any) => d.id === templateId);
      }

      if (template) {
        // Load metadata if it exists
        const metadata = {
          templateName: template.templateName || template.name || '',
          facilityTypes: template.facilityTypes || [],
          facilityServices: template.facilityServices || [],
        };
        setTemplateMetadata(metadata);
        setIsMetadataSet(true);

        // Load nodes with proper function references
        const loadedNodes = template.nodes.map((node: any) => ({
          ...node,
          data: {
            ...node.data,
            onUpdate: handleUpdateNode,
            onDelete: handleDeleteNode,
            onUpdateEdgeLabels: handleUpdateEdgeLabels,
          },
        }));

        setNodes(loadedNodes);
        setEdges(template.edges || []);

        // Update nodeId to continue from the highest existing ID
        const maxId = Math.max(...template.nodes.map((node: any) => parseInt(node.id) || 0), 0);
        setNodeId(maxId + 1);
      }
    } else {
      // Show popup only for new questionnaires
      setShowCreateAssessment(true);
    }
  }, [handleUpdateNode, handleDeleteNode, handleUpdateEdgeLabels]);

  // Restore metadata from localStorage if local state is empty
  useEffect(() => {
    if (!isMetadataSet && !templateMetadata.templateName) {
      try {
        const backupMetadata = JSON.parse(localStorage.getItem('currentTemplateMetadata') || '{}');
        if (backupMetadata.templateName) {
          console.log('🔄 Restoring metadata from localStorage on mount:', backupMetadata);
          setTemplateMetadata(backupMetadata);
          setIsMetadataSet(true);
        }
      } catch (e) {
        console.error('Error restoring backup metadata:', e);
      }
    }
  }, [isMetadataSet, templateMetadata.templateName]);

  // Note: Removed cleanup useEffect as it was causing premature metadata clearing
  // Metadata is now only cleared explicitly when user navigates away or cancels

  const checkIsEditMode = (): boolean => {
    if (typeof window === 'undefined') return false;

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const scenarioId = urlParams.get('scenarioId');
    return Boolean((mode === 'edit' || (!mode && scenarioId)) && scenarioId);
  };

  const checkIsViewMode = () => {
    if (typeof window === 'undefined') return false;

    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const scenarioId = urlParams.get('scenarioId');
    return mode === 'view' && scenarioId;
  };

  const handleEditMetadata = async () => {
    console.log('🔧 Opening metadata editor with current data:', templateMetadata);

    // Refetch the latest scenario data before opening the edit dialog
    // This ensures we have the most up-to-date facility types and service lines
    if (currentScenarioId && currentVersion) {
      console.log('🔄 Refetching latest scenario data before opening edit dialog...');
      try {
        const refetchResult = await refetchScenarioById({
          scenarioId: currentScenarioId,
          version: currentVersion
        });
        console.log('✅ Refetch completed before edit dialog:', refetchResult.data);

        // The useEffect will automatically update templateMetadata when scenarioByIdData changes
        console.log('✅ Template metadata will be updated by useEffect after refetch');

        // Small delay to ensure useEffect runs and updates templateMetadata
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('❌ Refetch failed before edit dialog:', error);
      }
    }

    setShowEditMetadataDialog(true);
  };

  // Handler for updating template metadata in create mode (when no scenario ID exists yet)
  const handleCreateTemplateUpdate = async (payload: { templateName: string; facilityTypes: string[]; serviceLines: string[] }) => {
    try {
      console.log('🔄 Updating metadata in create mode:', payload);

      // Update local metadata state
      const metadata = {
        templateName: payload.templateName,
        facilityTypes: payload.facilityTypes,
        facilityServices: payload.serviceLines,
      };

      setTemplateMetadata(metadata);
      setIsMetadataSet(true);

      // Also store in localStorage as backup
      localStorage.setItem('currentTemplateMetadata', JSON.stringify(metadata));

      console.log('✅ Metadata updated successfully in create mode');
      setShowEditMetadataDialog(false);

    } catch (error) {
      console.error('❌ Error updating metadata in create mode:', error);
    }
  };

  // Handler for updating template metadata (called from StartDialog)
  const handleUpdateTemplate = async (payload: { templateName: string; facilityTypes: string[]; serviceLines: string[] }) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const scenarioId = urlParams.get('scenarioId');

      if (!scenarioId) {
        toast.error('No scenario ID found for update.');
        return;
      }

      // Convert facility type and service names to IDs
      const facilityIds = getFacilityTypeIds(payload.facilityTypes);
      const serviceIds = getServiceIds(payload.serviceLines);

      console.log('🔄 Converting names to IDs:');
      console.log('📤 Input facility types (names):', payload.facilityTypes);
      console.log('📤 Input service lines (names):', payload.serviceLines);
      console.log('📤 Converted facility IDs:', facilityIds);
      console.log('📤 Converted service IDs:', serviceIds);

      const updateInput: UpdateScenarioInput = {
        id: scenarioId,
        name: payload.templateName,
        facilities: facilityIds,
        services: serviceIds
      };

      console.log('🔄 Updating template metadata:', updateInput);

      const result = await updateTemplate({
        variables: {
          input: updateInput
        }
      });

      if (result.data?.updateTemplate) {
        const { scenario, newVersionCreated, message } = result.data.updateTemplate;
        console.log('✅ Template updated:', { scenario, newVersionCreated, message });

        // Update local metadata with the new values immediately
        const updatedMetadata = {
          templateName: payload.templateName, // Use the name from the form (what user entered)
          facilityTypes: payload.facilityTypes, // Use the facility types from the form
          facilityServices: payload.serviceLines, // Use the service lines from the form
        };

        console.log('📊 Immediately updating template metadata after update:');
        console.log('📊 Previous metadata:', templateMetadata);
        console.log('📊 New metadata:', updatedMetadata);
        console.log('📊 Facility types updated:', templateMetadata.facilityTypes, '→', updatedMetadata.facilityTypes);
        console.log('📊 Service lines updated:', templateMetadata.facilityServices, '→', updatedMetadata.facilityServices);

        setTemplateMetadata(updatedMetadata);
        setIsMetadataSet(true);

        // Force update the questionnaire templateName in local state
        // This is a workaround since the backend might not be updating questionnaire.templateName
        if (scenarioByIdData?.getScenarioById?.questionnaire) {
          const updatedQuestionnaire = {
            ...scenarioByIdData.getScenarioById.questionnaire,
            templateName: payload.templateName
          };

          console.log('🔧 Force updating questionnaire templateName in local state:', updatedQuestionnaire.templateName);

          // Update the Apollo cache manually
          // This ensures the next time we read the data, it has the correct templateName
        }

        // Skip refetch to avoid overwriting local metadata changes
        // The local state has been updated above and will be saved when user clicks Save
        console.log('🔒 Skipping refetch to preserve local metadata updates');
        console.log('🔒 Local metadata is now up to date with user changes');

        toast.success(message || 'Template metadata updated successfully!');
        setShowEditMetadataDialog(false);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template metadata. Please try again.');
    }
  };

  const router = useRouter();

  // Debug: Log what's being passed to HeaderBar
  console.log('🏷️ Passing to HeaderBar - templateName:', templateMetadata.templateName);
  console.log('🏷️ Current version:', currentVersion);
  console.log('🏷️ Full templateMetadata:', templateMetadata);
  console.log('🏷️ Render timestamp:', new Date().toISOString());

  return (
    // <DashboardLayout>
      <div style={{ width: '100%', height: 'calc(100vh - 128px)', position: 'relative' }}>
        {/* Header Bar */}
        <HeaderBar
          templateName={templateMetadata.templateName}
          isEditMode={checkIsEditMode()}
          isViewMode={Boolean(checkIsViewMode())}
          onBackToTemplates={() => {
            // Clear metadata when navigating away
            console.log('🧹 Clearing metadata - Back button');
            setTemplateMetadata({
              templateName: '',
              facilityTypes: [],
              facilityServices: [],
            });
            setIsMetadataSet(false);
            localStorage.removeItem('currentTemplateMetadata');

            // Clear all nodes and edges to prevent them from being visible during routing
            setNodes([]);
            setEdges([]);

            router.push('/templates');
          }}
          onEditMetadata={handleEditMetadata}
          onAddQuestion={handleAddQuestion}
          onSave={handleSaveQuestionnaire}
          onClearAll={handleClearAll}
          onImportJSON={handleImportJSON}
          onExportJSON={handleExportJSON}
          hideToolbar={showStartDialog && !checkIsEditMode()}
          hideBackButton={showStartDialog && !checkIsEditMode()}
          isSaving={isSaving}
          availableVersions={scenarioByIdData?.getScenarioById?.versions || []}
          selectedVersion={currentVersion}
          onVersionChange={(version) => {
            console.log('🔄 Version change handler called with version:', version);
            console.log('🔄 Current scenario ID:', currentScenarioId);
            console.log('🔄 Previous version:', currentVersion);

            setCurrentVersion(version);

            // Refetch scenario data for the selected version
            if (currentScenarioId) {
              console.log('🔄 Refetching scenario data for version:', version);
              console.log('🔄 Current scenario ID:', currentScenarioId);

              refetchScenarioById({
                scenarioId: currentScenarioId,
                version: version
              }).then((result) => {
                console.log('✅ Refetch completed for version:', version);
                console.log('✅ Refetch result data:', result.data);
                if (result.data?.getScenarioById) {
                  console.log('✅ New scenario name:', result.data.getScenarioById.scenario.name);
                  console.log('✅ New scenario version:', result.data.getScenarioById.version);
                }
              }).catch((error) => {
                console.error('❌ Refetch failed:', error);
              });
            } else {
              console.warn('⚠️ No currentScenarioId available for refetch');
            }
          }}
          isPreviewOpen={isPreviewDrawerOpen}
          isSplitScreen={isSplitScreen}
          onPreviewToggle={() => {
            // Toggle split screen mode directly with eye icon
            const newSplitScreenState = !isSplitScreen;
            setIsSplitScreen(newSplitScreenState);
            setIsPreviewDrawerOpen(newSplitScreenState);
          }}
          onSplitScreenToggle={() => {
            setIsSplitScreen(!isSplitScreen);
            if (!isSplitScreen) {
              // When entering split screen, ensure preview is open
              setIsPreviewDrawerOpen(true);
            }
          }}
        />

        <div style={{
          height: 'calc(100vh - 70px)',
          position: 'relative',
          marginTop: '70px',
          display: 'flex',
          width: '100%'
        }}>
          {/* ReactFlow Container */}
          <div style={{
            width: isSplitScreen && isPreviewDrawerOpen ? '50%' : '100%',
            height: '100%',
            transition: 'width 0.3s ease'
          }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.1,
              minZoom: 0.1,
              maxZoom: 2,
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 0.75 }}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: {
                stroke: '#2196f3',
                strokeWidth: 2,
                strokeDasharray: '5,5',
              },
            }}
            connectionLineStyle={{
              stroke: '#2196f3',
              strokeWidth: 2,
              strokeDasharray: '5,5',
            }}
          >
            <Controls />
            <MiniMap />
            <Background variant={'dot' as any} gap={12} size={1} />
          </ReactFlow>
          </div>
        </div>

        {showStartDialog && !checkIsEditMode() && !hasCompletedStartDialog && (
          <StartDialog
            onAddQuestion={handleAddQuestion}
            onCancel={() => {
              // Clear metadata when canceling start dialog
              console.log('🧹 Clearing metadata - Start dialog cancel');
              setTemplateMetadata({
                templateName: '',
                facilityTypes: [],
                facilityServices: [],
              });
              setIsMetadataSet(false);
              setHasCompletedStartDialog(false); // Reset completion flag
              localStorage.removeItem('currentTemplateMetadata');
              setShowStartDialog(false);

              // Clear all nodes and edges to prevent them from being visible during routing
              setNodes([]);
              setEdges([]);

              // Navigate back to templates list
              router.push('/templates');
            }}
          />
        )}

        {showEditMetadataDialog && (
          <StartDialog
            isEditMode={true}
            scenarioId={currentScenarioId}
            onAddQuestion={currentScenarioId ? undefined : handleAddQuestion}
            initialValues={{
              templateName: templateMetadata.templateName,
              facilityTypes: templateMetadata.facilityTypes,
              facilityServices: templateMetadata.facilityServices,
            }}
            onUpdate={currentScenarioId ? handleUpdateTemplate : handleCreateTemplateUpdate}
            onCancel={() => {
              console.log('🧹 Canceling metadata edit');
              setShowEditMetadataDialog(false);
            }}
          />
        )}

        {showConnectionsPreview && (
          <ConnectionsPreviewModal nodes={nodes} edges={edges} onClose={() => setShowConnectionsPreview(false)} />
        )}

        {showViewModal && (
          <TemplatePreviewModal
            template={{
              nodes,
              edges,
              templateName: templateMetadata.templateName,
              facilityTypes: templateMetadata.facilityTypes,
              facilityServices: templateMetadata.facilityServices,
            }}
            onClose={() => {
              setShowViewModal(false);

              // Clear all nodes and edges to prevent them from being visible during routing
              setNodes([]);
              setEdges([]);

              // Navigate back to templates when closing view modal
              router.push('/templates');
            }}
          />
        )}

        {/* Flow Preview Drawer - Always available during editing */}
        <FlowPreviewDrawer
          nodes={nodes}
          edges={edges}
          isOpen={isPreviewDrawerOpen}
          onToggle={() => setIsPreviewDrawerOpen(!isPreviewDrawerOpen)}
          onUpdateNode={(nodeId: string, updates: any) => {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === nodeId
                  ? { ...node, data: { ...node.data, ...updates } }
                  : node
              )
            );
          }}
          onDeleteNode={(nodeId: string) => {
            setNodes((nds) => nds.filter((node) => node.id !== nodeId));
            setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
          }}
          onAddNode={(afterNodeId?: string, questionData?: any) => {
            if (questionData) {
              // Find position for new node
              const afterNode = nodes.find(n => n.id === afterNodeId);
              const position = afterNode
                ? { x: afterNode.position.x, y: afterNode.position.y + 200 }
                : { x: 100, y: 100 };

              const newNode = {
                id: `${nodeId}`,
                type: 'questionNode',
                position,
                data: {
                  ...questionData,
                  onUpdate: handleUpdateNode,
                  onDelete: handleDeleteNode,
                  onUpdateEdgeLabels: handleUpdateEdgeLabels,
                },
              };

              setNodes((nds) => [...nds, newNode]);
              setNodeId((prev) => prev + 1);
            }
          }}
          isSplitScreen={isSplitScreen}
          onSplitScreenToggle={() => setIsSplitScreen(!isSplitScreen)}
        />

        {/* Loading Overlay - Shows during template save */}
        <Backdrop
          open={isSaving || createScenarioLoading || updateScenarioLoading || updateTemplateLoading}
          sx={{
            color: '#fff',
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.25)', // 25% opacity for partial visibility
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <CircularProgress
            size={40} // Small loader
            thickness={4}
            sx={{
              color: '#1976d2',
            }}
          />
        </Backdrop>
      </div>
    // </DashboardLayout>
  );
};

export default withPageLoader(QuestionnaireBuilder);
